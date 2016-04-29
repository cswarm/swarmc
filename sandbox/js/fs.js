/**
 * fs
 * @constructor
 **/

'use strict';

const fs         = require('fs'),
      pth        = require('path'),
      mkdirp     = require('mkdirp'),
      lineReader = require('n-readlines'),
      debug      = require('debug')('swarmc:fs');

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
 * Based on file paths, determine which dir to pull from.
 *
 * @param {String} path - path to determine where to pull from.
 * @returns {String} absolute path determined. Not 100&.
 **/
let getBase = (path) => {
  debug('getBase', path);
  let overlays = getFileOverlays();

  path = path.replace(/\.[A-Z0-9]*/gi, '');

  let dirs = path.split("/");

  const MAXSCORE = dirs.length;

  // generate scoring
  let scores = {};
  overlays.forEach(overlay => {
    scores[overlay.dir] = 0;
  });

  let DIRCACHE = "";
  dirs.forEach(v => {
    // TODO: split dir names, combine together using path, search each overlay.
    // The one with the highest amount of matches "score" is the one to write too.
    // in an equal match situation, we will write to the one with the highest
    // "priority", which is determined by position in array [0] is highest.

    DIRCACHE = pth.join(DIRCACHE, v);

    overlays.forEach(overlay => {
      let dir = overlay.dir;

      let DIRSCORE = pth.join(dir, DIRCACHE);

      if(fs.existsSync(DIRSCORE)) {
        debug('getBase', dir, 'has', DIRSCORE);

        // up the score.
        scores[dir]++;
      }
    });
  });

  debug('getBase', 'max score is', MAXSCORE);

  let WINNER = null

  overlays.forEach(overlay => {
    let dir   = overlay.dir;
    let score = scores[dir];

    debug('getBase', overlay.dir, 'score is', score);

    // by using GTR we should avoid priority sitations.
    if(WINNER === null || (score > WINNER.score)) {
      WINNER = {
        dir: overlay.dir,
        score: score
      };
    }
  });

  debug('getBase', 'winner is', WINNER);

  return WINNER.dir;
}

/**
 * Make sure the path is clean.
 *
 * @param {String} path - path to serialize.
 * @returns {String} safe relative path.
 **/
let serializePath = (path) => {
  // replace / with ""
  path = path.replace(/^\//, '');

  // remove relative paths
  path = path.replace(/[\.]{2}\//g, '');

  return path;
}

/**
 * Combine overlays to generate a list of files.
 *
 * @param {String} path - path to search.
 * @returns {Array} array of files.
 **/
let listFile = (path) => {

  // Get the Overlay. Reverse the array to make the first looped last.
  let overlays = getFileOverlays().reverse();

  path = serializePath(path);

  debug('list', 'path='+path);

  let list = [];
  overlays.forEach(overlay => {
    let dir       = overlay.dir;
    let searchdir = pth.join(dir, path);

    // make sure it actually exists first.
    if(!fs.existsSync(searchdir)) {
      return;
    }

    debug('listFile', 'add', searchdir, 'to list array')

    let flist     = fs.readdirSync(searchdir);

    list          = list.concat(flist);
  });

  // remove duplicates from before
  list = list.filter((elem, pos) => {
    return list.indexOf(elem) == pos;
  });

  return list;
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

  file = serializePath(file);

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

    return pth.join(getBase(file), file);
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
  debug('writeFile', 'data is:', data);

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

  let contents = fs.readFileSync(file, 'utf8');

  return contents;
}

const  fsw = {
  root: pth.join(__dirname, '../../cc/'),

  /**
   * Open a file.
   *
   * @param {String} mode - r,w,a
   * @returns {Object} fs#open object
   **/
  open: function(mode) {
    let path = this;
    let c = {};
    let h;

    debug('open', 'new file handle path='+path);

    if(mode === "w") {
      debug('open:mode', 'w')

      let fpath = path;
      h = getFileStream('write', path);

      /**
       * write to one line
       **/
      c.writeLine = function() {
        debug('open:writeLine', 'path='+path);
        h.write(data+'\n');
        return;
      }

      /**
       * write data to the file.
       **/
      c.write = function() {
        debug('open:write', 'path='+path);

        let data = this;

        let res = writeFile(path, data, 'utf8');
        return;
      }
      /**
       * shim for flushing the data,
       **/
      c.flush = function() {
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
      c.readAll = function() {
        debug('open:readAll', 'path='+path)

        let contents = readFile(path, 'utf8');
        return contents;
      };

      /**
       * Get the next line in the buffer and return it.
       **/
      c.readLine = function() {
        debug('open:readLine', 'path='+path);

        let line = h.next();
        let lc   = line.toString('utf8');

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
    return listFile(this);
  },

  exists: function() {
    let path = getFile(this);

    if(!path) return false;

    return true;
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

    if(!path) {
      return false;
    }

    debug('makeDir', path);

    mkdirp.sync(path);

    return;
  },

  testBase: function() {
    let path = serializePath(this);

    return getBase(path);
  }
}

module.exports = fsw;
