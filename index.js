/**
 * Load Balancer & Load Sharing for Lua ComputerCraft scripts.
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 0.1.0
 * @license MIT
 **/

"use strict";

var L            = require('lua.vm.js'),
    debug        = require('debug')('ccs'),
    fs           = require('fs'),
    readlineSync = require('readline-sync'),
    log          = require('single-line-log').stdout,
    colors       = require('colors'),
    redis        = require("redis");

/**
 * Inject js into lua namespace.
 *-
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
var ccs = function(redis) {
  var state = null;
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
  var sandbox_fs = require('./sandbox/fs.js');

  // REMEMBER: C API.
  inject_js(this.l, sandbox_fs, "fs");

  inject_js(this.l, function() {
    debug('shutdown', 'os.shutdown triggered')
    process.exit()
  }, "js_shutdown")

  this.l().execute(fs.readFileSync('./sandbox/term.lua', 'utf8'));
  this.l().execute(fs.readFileSync('./sandbox/os.lua', 'utf8'));
  this.l().execute(fs.readFileSync('./sandbox/redstone.lua', 'utf8'));

  // inject your code here later.
  inject_js(this.l, {
    docode: function() {
      var debug = require('debug')('njs');

      var script = "/rom/programs/shell";
      var script_real = sandbox_fs.root+script.replace(/^\//, '');
      debug('docode', 'script='+script, 'script_real='+script_real)
      global.l().execute(fs.readFileSync(script_real, 'utf8'))
    },
    read: function() {
      return readlineSync.question('')
    },
    write: function() {
      var data = new String(this).toString('utf8');
      log(data)
    },
    host_emu_version: function() {
      return process.version;
    },
    host_openssl_version: function() {
      return process.versions['openssl'];
    },
    host_versions: function() {
      return process.versions;
    }
  }, "njs")

  try {
    this.l().execute(fs.readFileSync('./cc/bios.lua', 'utf8'));
  } catch(err) {
    console.log(colors.red(err.lua_stack));
  }
};

var c = new ccs(true);
c.doScript();
