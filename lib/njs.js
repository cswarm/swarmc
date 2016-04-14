/**
 * Native Javascript functions.
 *
 * @version 1.0.0
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 **/

'use strict';

const debug        = require('debug'),
      fs           = require('fs'),
      readlineSync = require('readline-sync');



const sys_d = require('debug')('syscall');
const njs_d = require('debug')('njs');

// hack to refer to this from inside lua.vm.js
let that;

module.exports = class Njs {
  // not needed but why not
  constructor(SCRIPT_ENTRY) {
    njs_d('constructed')
    that = this;
    this.SCRIPT_ENTRY = SCRIPT_ENTRY;
  }

  /**
   * This function executes the script to be "emulated"
   **/
  docode() {
    let debug = njs_d;

    let script = that.SCRIPT_ENTRY;
    let script_real = script;

    if(!script) {
      return console.error('not configured to run any script. Exiting.');
    }

    debug('docode', 'script='+script, 'script_real='+script_real);
    global.l().execute(fs.readFileSync(script_real, 'utf8'));
  }

  read() {
    return readlineSync.question('');
  }

  raw() {
    let data = this;

    sys_d('raw', '<data removed>');
    console.log(data);
  }

  write() {
    let data = new String(this).toString('utf8');

    if(data === 'null' || data === null || data === 'nil') {
      process.stdout.write('\n');
      return;
    }

    sys_d('write', data);

    process.stdout.write(data);
  }

  host_node_version() {
    return process.version;
  }

  host_openssl_version() {
    return process.versions['openssl'];
  }

  host_versions() {
    return process.versions;
  }

  host_built() {
    let nexeres;

    try {
      nexeres = require('nexeres');
    } catch(err) {
      return 'today'
    }

    return JSON.parse(nexeres.get('nexe-built.json')).date;
  }

  host_built_with() {
    let nexeres;

    try {
      nexeres = require('nexeres')
    } catch(err) {
      return 'not compilied'
    }

    return JSON.parse(nexeres.get('nexe-built.json')).hardware;
  }

  host_emu_commit() {
    let nexeres;

    try {
      nexeres = require('nexeres')
    } catch(err) {
      return fs.readFileSync('.git/refs/heads/master', 'utf8').substr(0, 7);
    }

    return JSON.parse(nexeres.get('nexe-built.json')).commit;
  }

  host_emu_version() {
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
