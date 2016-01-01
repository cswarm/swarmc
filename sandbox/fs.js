/**
 * fs
 * @constructor
 **/

"use strict";

var fs = require('fs'),
    pth = require('path'),
    debug = require('debug')('fs');

var fsw = {
  root: './cc/',

  /**
   * Get sandbox abs path
   **/
  get_abs: function(rel) {
    var root = fsw.root,
        unintialized = "nil", // incase of issues, *NEVER* give path.
        path = rel.replace(/^\//, '');

    // remove relative paths
    path = path.replace(/[\.]{2}\//g, '');

    unintialized = root+path;

    return unintialized;
  },

  open: function(mode) {
    var path = this;
    var c = {};

    path = fsw.get_abs(path)
    debug('open', 'new file handle path='+path);

    if(mode === "w") {
      var fpath = path;

      /**
       * write to one line
       **/
      c.writeLine = function(data) {
        var res = fs.writeFileSync(path, new String(data)+'\n', 'utf8');
        return;
      }

      /**
       * write data to the file.
       **/
      c.write = function(data) {
        var res = fs.writeFileSync(path, data, 'utf8');
        return;
      }
      /**
       * shim for flushing the data,
       **/
      c.flush = function() {
        return;
      }
    }

    if(mode === "r") {
      var fpath = path;

      /**
       * read file contents
       **/
      c.readAll = function() {
        debug('open:readAll', 'path='+path)
        var contents = fs.readFileSync(path, 'utf8');
        return contents;
      };

      /**
       * shim for closing the file
       **/
      c.close = function() {
        debug('open:close', 'path='+path)
        return;
      };
    }

    if(mode === "a") {

    }

    return c;
  },
  /**
   * List files in a directory
   **/
  list: function() {
    var path = fsw.get_abs(this)

    debug('list', 'path='+path)
    global.l().execute('local_table = {}');
    var files = fs.readdirSync(path);

    for (var i in files){
      // console.log(files[i], 'add')
      global.l().execute('local_table[#local_table+1] = "'+files[i]+'"');
    }

    var res = global.l().execute('return local_table')[0];
    global.l().execute('local_table = nil')

    return res;
  },

  exists: function() {
    var path = this;
    path = fsw.get_abs(path)

    return fs.existsSync(path);
  },

  /**
   * determine if a path is a directory
   **/
  isDir: function() {
    var path = this;
    path = fsw.get_abs(path);

    // if it's a .. path, we don't count that as a dir.
    var regex = new RegExp('[\.\.]$');
    if(regex.test(path)) {
      return false;
    }

    if(fs.lstatSync(path).isDirectory()) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Get file size cc compat.
   **/
  getSize: function() {
    var path = this;
    path = fsw.get_abs(path())
    return fs.statSync(path['size']);
  },

  /**
   * Get the name of a file
   **/
  getName: function() {
    var path = this;
    return pth.basename(this);
  },

  /**
   * combine two paths together
   **/
  combine: function(local) {
    var first = this;

    var res;
    local = local.replace(/[\/]$/, ''); // remove /
    first = first.replace(/[\/]$/, '')
    res = first.replace(/$\//, '')+'/'+local.replace(/^\//, '');
    return res;
  }
}

module.exports = fsw;
