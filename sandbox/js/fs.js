/**
 * fs
 * @constructor
 **/

'use strict';

const fs         = require('fs'),
      pth        = require('path'),
      lineReader = require('n-readlines'),
      debug      = require('debug')('fs');

/**
 * Get the array of locations to search for files in.
 *
 * @todo make it customizable.
 * @returns {Array} array of locations.
 **/
let getFileOverlays = () => {
  return [
    {
      dir: process.cwd()
    },

    {
      dir: fsw.root,
      readonly: true
    }
  ];
}

/**
 * Generice Function to create an "overlay".
 *
 * @param {String} type - read/write
 * @param {String} path - path to file.
 * @param {String} mode - file mode to provide to fs#create[Type]Stream
 *
 * @returns {FileStream} node.js WriteStream
 **/
let getFileStream = (type, path, mode) => {
  let stream = fs.createWriteStream;
  if(type === 'read') {
    stream   = fs.createReadStream;
  }

  let file = getFile(path);

  if(!file) {
    return false;
  }

  debug('getFileStream', 'create Stream type', type);

  return stream(file, {
    flags: mode || "w"
  });
}

/**
 * Find a file from overlays.
 *
 * @param {String} file - relative file to find.
 * @returns {String} path of absolute file.
 **/
let getFile = (file) => {
  let overlays = getFileOverlays();

  // replace / with ""
  file = file.replace(/^\//, '');

  // remove relative paths
  file = file.replace(/[\.]{2}\//g, '');

  debug('getFile', 'given', file);

  let path = null;
  overlays.forEach((overlay) => {
    let dir = overlay.dir;
    let gen_abs = pth.join(dir, file);

    debug('getFile', 'process overlay dir:', dir);

    if(fs.existsSync(gen_abs) && path === null) {
      path = gen_abs;
    }
  });

  if(path === null) {
    debug('getFile', 'couldn\'t find', file);
    return false;
  }

  debug('getFile', 'found', file, 'to be at', path);

  return path;
}

/**
 * Write to a file.
 *
 * @param {String} path - path to file.
 * @param {Variable} data - data to write.
 *
 * @returns {fs#writeFileSync} - output of that.
 **/
let writeFile = (path, data) => {
  debug('writeFile', 'write file to', path);

  let file = getFile(path);

  if(!file) {
    return false;
  }

  return fs.writeFileSync(file, data, 'utf8');
}

/**
 * Read a file from the overlays.
 *
 * @param {String} path - path to file.
 * @returns {fs#readFileSync} output of this.
 **/
let readFile = (path) => {
  debug('readFile', 'read file from', path);

  let file = getFile(path);

  if(!file) {
    return false;
  }

  console.log(file);

  let contents = fs.readFileSync(file, 'utf8');

  return contents;
}

var fsw = {
  root: pth.join(__dirname, '../../cc/'),

  /**
   * Open a file.
   *
   * @param {String} mode - r,w,a
   * @returns {Object} fs#open object
   **/
  open: function(mode) {
    var path = this;
    var c = {};
    let h;

    debug('open', 'new file handle path='+path);

    if(mode === "w") {
      debug('open:mode', 'w')

      let fpath = path;
      h = getFileStream('write', path);

      /**
       * write to one line
       **/
      c.writeLine = data => {
        debug('open:writeLine', 'path='+path);
        h.write(data+'\n');
        return;
      }

      /**
       * write data to the file.
       **/
      c.write = data => {
        debug('open:write', 'path='+path);

        let res = writeFile(path, data, 'utf8');
        return;
      }
      /**
       * shim for flushing the data,
       **/
      c.flush = () => {
        debug('open:flush', 'path='+path);
        return;
      }
    }

    if(mode === "r") {
      debug('open:mode', 'r');

      let fpath = path;
      let ln = 0;

      let file = getFile(path);

      if(!file) {
        return "nil"; // doesn't exist.
      }

      // line reader instance
      h = new lineReader(file);

      /**
       * Read the entirety of a files contents.
       **/
      c.readAll = () => {
        debug('open:readAll', 'path='+path)

        let contents = readFile(path, 'utf8');
        return contents;
      };

      /**
       * Get the next line in the buffer and return it.
       **/
      c.readLine = () => {
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
      h = getFileStream("write", path, "w+");
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
    const path = getFile(this);

    debug('list', 'path='+path);

    let files;
    try {
      files = fs.readdirSync(path);
    } catch(e) {
      return;
    }

    return files;
  },

  exists: function() {
    var path = getFile(this);

    return fs.existsSync(path);
  },

  /**
   * determine if a path is a directory
   **/
  isDir: function() {
    const path = getFile(this);

    if(!path) {
      return false;
    }

    // if it's a .. path, we don't count that as a dir.
    let regex = new RegExp('[\.\.]$');
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
    const path = getFile(this);

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
    const path = getFile(this);

    return fs.statSync(path['size']);
  },

  /**
   * Get the name of a file
   **/
  getName: function() {
    const path = this;
    return pth.basename(path);
  },

  /**
   * Get the Directory from the file.
   **/
  getDir: function() {
    const path = this;
    return pth.dirname(path)
  },

  /**
   * combine two paths together
   **/
  combine: function(local) {
    let first = this;

    let res;
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
    let path = getFile(this);

    try {
      fs.mkdirSync(path);
    } catch(e) {
      // do nothing
    }

    return;
  }
}

module.exports = fsw;
