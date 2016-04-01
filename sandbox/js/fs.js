/**
 * fs
 * @constructor
 **/

'use strict';

var fs = require('fs'),
    pth = require('path'),
    lineReader = require('n-readlines'),
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

  /**
   * Open a file.
   **/
  open: function(mode) {
    var path = this;
    var c = {};
    let h;

    path = fsw.get_abs(path)
    debug('open', 'new file handle path='+path);

    if(mode === "w") {
      debug('open:mode', 'w')
      var fpath = path;
      h = fs.createWriteStream(path);

      /**
       * write to one line
       **/
      c.writeLine = function(data) {
        debug('open:writeLine', 'path='+path);
        h.write(data+'\n');
        return;
      }

      /**
       * write data to the file.
       **/
      c.write = function(data) {
        debug('open:write', 'path='+path);
        var res = fs.writeFileSync(path, data, 'utf8');
        return;
      }
      /**
       * shim for flushing the data,
       **/
      c.flush = function() {
        debug('open:flush [ignored]', 'path='+path);
        return;
      }
    }

    if(mode === "r") {
      debug('open:mode', 'r');

      let fpath = path;
      let ln = 0;

      // line reader instance
      h = new lineReader(path);

      /**
       * Read the entirety of a files contents.
       **/
      c.readAll = function() {
        debug('open:readAll', 'path='+path)
        var contents = fs.readFileSync(path, 'utf8');
        return contents;
      };

      /**
       * Get the next line in the buffer and return it.
       **/
      c.readLine = function() {
        debug('open:readLine', 'path='+path);

        let line = h.next();
        let lc = line.toString('utf8');

        if(line === false) {
          return;
        }

        ln++;

        debug('open:readLine', 'ln='+ln);
        debug('open:readLine', 'lc='+lc);
        return lc;
      };
    }

    // not supported.
    if(mode === "a") {
      debug('open:mode', 'a')
      h = fs.createWriteStream(path);
    }

    // global methods.
    c.close = function() {
      debug('open:close', 'path='+path);
      if(mode === 'r') {
        h = undefined;
      } else {
        h.close();
      }
      return;
    }

    return c;
  },

  /**
   * List files in a directory
   **/
  list: function() {
    let files;
    let path = fsw.get_abs(this)

    debug('list', 'path='+path);

    try {
      files = fs.readdirSync(path);
    } catch(e) {
      return;
    }

    return files;
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
   * Basic shim for readonly.
   **/
  isReadOnly: function() {
    var path = this;
    path = fsw.get_abs(path);
    let bn = pth.basename(path);

    if(bn === 'bios.lua') {
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
    path = fsw.get_abs(path);
    return fs.statSync(path['size']);
  },

  /**
   * Get the name of a file
   **/
  getName: function() {
    var path = this;
    return pth.basename(this);
  },

  getDir: function() {
    let path = this;
    return pth.dirname()
  },

  /**
   * combine two paths together
   **/
  combine: function(local) {
    var first = this;

    var res;
    try {
      res = pth.join(first, local);
    } catch(e) {
      return;
    }

    return res;
  },

  /**
   * Create a dir
   **/
  makeDir: function() {
    let path = fsw.get_abs(this);

    try {
      fs.mkdirSync(path);
    } catch(e) {
      // do nothing
    }

    return;
  }
}

module.exports = fsw;
