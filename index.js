/**
 * Load Balancer & Load Sharing for Lua ComputerCraft scripts.
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 0.1.2
 * @license MIT
 *
 * @TODO implement better fs => project overlaying.
 **/

"use strict";

const L            = require('lua.vm.js'),
      debug        = require('debug')('ccs'),
      fs           = require('fs'),
      path         = require('path'),
      readlineSync = require('readline-sync'),
      colors       = require('colors'),
      redis        = require("redis");

// scope
let SCRIPT_ENTRY;

/**
 * Inject js into lua namespace.
 *
 * @param state {Lua.State} lua state
 * @param code {string} code to push
 * @param globals {string} to be inserted into luanamespace as
 **/
function inject_js(state, code, globals) {
  state().pushjs(code);
  state().setglobal(globals);
  state().pop(0);
}

/**
 * ccs
 *
 * @constructor
 **/
let ccs = function(redis) {
  let state = null;
  this.use_redis = redis;
  this.l = function() {
    if(state === null) {
      state = new L.Lua.State(); // for load balancing later.
    }

    return state;
  }
  this.lua_version = new String(this.l().execute('return _VERSION')).replace('Lua ', '');

  global.l = this.l;

  debug('constructor', 'using lua version '+this.lua_version+' with redis='+redis);
};

/**
 * Emulate a computercraft script
 *
 * @return
 **/
ccs.prototype.doScript = function() {
  inject_js(this.l, function() {
    debug('shutdown', 'os.shutdown triggered /OR/ EOF')
    process.exit()
  }, "js_shutdown")

  /* shim for lua 5.1 */
  inject_js(this.l, function() {
    return {};
  }, "getfenv");

  inject_js(this.l, function() {
    return function() {};
  }, "setfenv")

  // include our lua sandboxes.
  // TODO: auto load them
  const luaapis = fs.readdirSync('./sandbox/lua');
  const jsapis = fs.readdirSync('./sandbox/js');
  if(luaapis && jsapis) {
    let debug = require('debug')('api');

    // JavaScript APIs
    jsapis.forEach(v => {
      let global_name = path.parse(v).name;

      debug('load', v, 'to global', global_name);

      let apio = require('./sandbox/js/'+v);
      inject_js(this.l, apio, global_name);
    });

    // Lua APIs
    luaapis.forEach(v => {
      debug('load', path.basename(v));

      this.l().execute(fs.readFileSync(path.join('./sandbox/lua', v), 'utf8'));
    });
  } else {
    console.log(luaapis);
    console.log(jsapis);
    throw 'Failed to load sandbox apis.';
  }

  // TODO: document.
  const njs = {
    sys_d: require('debug')('syscall'),
    njs_d: require('debug')('njs'),

    /**
     * This function executes the script to be "emulated"
     **/
    docode: function() {
      let debug = njs.njs_d;

      // internalize script, TODO: entrypoint so it actually works..
      let script = SCRIPT_ENTRY;
      let script_real = script;

      debug('docode', 'script='+script, 'script_real='+script_real);
      global.l().execute(fs.readFileSync(script_real, 'utf8'));
    },

    read: function() {
      return readlineSync.question('');
    },

    raw: function() {
      let data = this;

      njs.sys_d('raw', '<data removed>');
      console.log(data);
    },

    write: function() {
      let data = new String(this).toString('utf8');

      if(data === 'null' || data === null || data === 'nil') {
        process.stdout.write('\n');
        return;
      }

      njs.sys_d('write', data);

      process.stdout.write(data);
    },

    host_node_version: function() {
      return process.version;
    },

    host_openssl_version: function() {
      return process.versions['openssl'];
    },

    host_versions: function() {
      return process.versions;
    },

    host_built: function() {
      let nexeres;

      try {
        nexeres = require('nexeres');
      } catch(err) {
        return 'today'
      }

      return JSON.parse(nexeres.get('nexe-built.json')).date;
    },

    host_built_with: function() {
      let nexeres;

      try {
        nexeres = require('nexeres')
      } catch(err) {
        return 'not compilied'
      }

      return JSON.parse(nexeres.get('nexe-built.json')).hardware;
    },

    host_emu_commit: function() {
      let nexeres;

      try {
        nexeres = require('nexeres')
      } catch(err) {
        return fs.readFileSync('.git/refs/heads/master', 'utf8').substr(0, 7);
      }

      return JSON.parse(nexeres.get('nexe-built.json')).commit;
    },

    host_emu_version: function() {
      let nexeres;

      try {
        nexeres = require('nexeres')
      } catch(err) {
        return JSON.parse(fs.readFileSync('./package.json')).version+'-'+fs.readFileSync('.git/refs/heads/master', 'utf8').substr(0, 7);
      }

      const nexe_data = JSON.parse(nexeres.get('nexe-built.json'));
      return nexe_data.version+'-'+nexe_data.commit;
    }
  }

  // inject sys heads
  inject_js(this.l, njs, "njs");

  try {
    this.l().execute(fs.readFileSync('./sandbox/bios.lua', 'utf8'));
  } catch(err) {
    console.log(colors.red(err.lua_stack));
    readlineSync.question('waiting....');
  }
};

// initalize the new class.
var c = new ccs(true);

// TODO OP PARSE
SCRIPT_ENTRY=process.argv[2];

// do the main script
c.doScript();
