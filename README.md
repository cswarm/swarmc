# swarmc

A light-weight ComputerCraft emulator using Lua 5.2.4


## Features

 * Emulates computercraft
 * Hardware accelerated crypto using OpenSSL
 * Full control over Lua VM

## Usage / Installation

```bash
  git clone git@github.com:jaredallard/swarmc --recursive
  -- OR WITHOUT SSH KEY --
  git clone https://github.com/jaredallard/swarmc --recursive

  npm install

  node bin/swarmc [script] # or use swarmc.json
```

## `swarmc.json`

Introduced in 1.0.1 is a new method of utilizing `swarmc`. Primarily for bundled
situations, i.e `swarmc-docker` and etc. This format enables you to hard depend
on node & swarmc versions as well as specify main files in a simple JSON format.

```js
{
  "main": "my/script/folder", // IMPORTANT: This does NOT change the CWD.
  "name": "scriptexample",
  "dependencies": {           // Dependency control! Look familiar?
    "node": "5.x.x",          // This is *very* useful, as node has changed a lot.
    "swarmc": "^1.0.0"        // Oh yeah, we support npm's semver goodness.
  }
}
```

## License

MIT
