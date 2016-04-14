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

const L            = require('swarm-lua'),
      debug        = require('debug')('ccs'),
      fs           = require('fs'),
      path         = require('path'),
      readlineSync = require('readline-sync'),
      colors       = require('colors');


// our libraries.
const Njs          = require('./lib/njs.js');
let njs;

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
 * @returns {undefined} nothing currently
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

  // inject sys heads
  inject_js(this.l, njs, "njs");

  try {
    this.l().execute(fs.readFileSync('./sandbox/bios.lua', 'utf8'));
  } catch(err) {
    console.log(colors.red(err.lua_stack));
    readlineSync.question('waiting....');
  }
};

let SCRIPT_ENTRY = process.argv[2];

// initalize the new class.
const c   = new ccs(true);
      njs = new Njs(SCRIPT_ENTRY);

// start the process
c.doScript(SCRIPT_ENTRY);
