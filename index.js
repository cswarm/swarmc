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
      debug        = require('debug')('swarmc'),
      fs           = require('fs'),
      path         = require('path'),
      semver       = require("semver"),
      readlineSync = require('readline-sync'),
      colors       = require('colors');

// our addons.
const Njs = require("./lib/njs.js");

let njs = new Njs();

/**
 * Inject js into lua namespace.
 *
 * @param state {Lua.State} lua state
 * @param code {string} code to push
 * @param globals {string} to be inserted into luanamespace as
 **/
let inject_js = (state, code, globals) => {
  state().pushjs(code);
  state().setglobal(globals);
  state().pop(0);
}

module.exports = class Swarmc {
  /**
   * Construct Swarmc.
   *
   * @constructor
   **/
  constructor(redis) {
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
  }

  /**
   * Inject the lua/js APIs.
   *
   * @returns {undefined} nothing yet.
   **/
  inject() {
    inject_js(this.l, function() {
      debug('shutdown', 'os.shutdown triggered /OR/ EOF')
      process.exit()
    }, "js_shutdown")

    /* shim for lua 5.1 */
    inject_js(this.l, function() {
      return {};
    }, "getfenv");

    inject_js(this.l, function() {
      return () => {};
    }, "setfenv")

    // include our lua sandboxes.
    const luaapis = fs.readdirSync('./sandbox/lua');
    const jsapis = fs.readdirSync('./sandbox/js');
    if(luaapis && jsapis) {
      let debug = require('debug')('swarmc:api');

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
  }

  /**
   * Attempt to run Swarmc from a JSON file.
   *
   * @returns {undefined} not yet.........
   **/
  useJSON(swarmc) {
    let provides = {
      node: process.versions.node,
      swarmc: require("./package.json").version
    };

    debug("json", "got", swarmc);

    let PROG_NAME = swarmc.name;
    let PROG_MAIN = swarmc.main;

    if(!PROG_NAME) {
      console.error("swarmc: ERR ", "swarmc.json includes no name.");
    }

    if(!PROG_MAIN) {
      console.error("swarmc: ERR ", "swarmc.json doesn't describe a main file.")
    }

    if(swarmc.dependencies) {
      Object.keys(swarmc.dependencies).forEach((key) => {
        const DEP_VER  = swarmc.dependencies[key];
        const DEP_NAME = key;

        if(!provides[DEP_NAME]) {
          console.error(
            "swarmc: ERR ", PROG_NAME, "dep", DEP_NAME,
            "was unable to be satisfied."
          );
          return;
        }

        debug("json:dep", "req", DEP_NAME, DEP_VER);

        let DEP_SAT = semver.satisfies(provides[DEP_NAME], DEP_VER);

        debug("json:dep", "req", DEP_NAME, "satifies", DEP_SAT);

        if(!DEP_SAT) {
          console.warn(
            "swarmc: WARN", PROG_NAME, "requested", DEP_NAME+"@"+DEP_VER, "but got",
            DEP_NAME+"@"+provides[DEP_NAME]
          );
        }
      })
    }

    this.doScript(PROG_MAIN);
  }

  /**
   * Emulate a Computercraft Script.
   *
   * @returns {undefined} doesn't need to return.
   **/
  doScript(script) {
    this.inject();

    // hack for now
    njs.SCRIPT_ENTRY = script;

    try {
      this.l().execute(fs.readFileSync('./sandbox/bios.lua', 'utf8'));
    } catch(err) {
      console.log(colors.red(err.lua_stack));
      readlineSync.question('waiting....');
    }
  }
}
