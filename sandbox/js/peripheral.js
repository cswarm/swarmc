/**
 * Peripheral Override.
 *
 * @name Peripheral
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 **/

'use strict';

const request = require('request'),
      pth     = require('path'),
      fs      = require('fs'),
      debug   = require('debug')('swarmc:peripheral');

let self;

class Peripheral {
  constructor() {
    self = this;
    this.peripherals = {
      right:  {
        type: 'modem'
      },
      left:   null,
      top:    null,
      bottom: null,
      back:   null,
      front:  null
    };
  }

  /**
   * Determine if a peripheral is present.
   *
   * @param {String} side - side peripheral should be on.
   * @returns {Boolean} true if present, nil if not.
   **/
  isPresent() {
    try {
      let side = this;
      let device = self.peripherals[side];

      if(device === null) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Get the type of peripheral.
   *
   * @param {String} side - side peripheral is on.
   * @returns {String|nil} type of peripheral, nil if not present.
   **/
  getType() {
    try {
      let side = this;
      let device = self.peripherals[side];

      if(device === null) {
        return 'nil';
      }

      return device.type;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Call a method... not going to be the same.
   *
   * @param {String} method - method name
   * @param {*} args - arguments to pass to the method.
   * @returns {*} depends on the method call
   **/
  call(method, args) {
    let side = this;
    let device = self.peripherals[side];

    debug('call', 'on side', side, 'execute', method, 'with', args);

    if(!device) {
      // doesn't exist.
      debug('call', 'doesn\'t exist.')
      return 'nil';
    }

    if(!device.instance) {
      debug('call', 'device hasn\'t been instanced, doing so.');

      let WRAPPED  = pth.join(__dirname, '../', 'wrapped');
      let SIDEWRAP = pth.join(WRAPPED, device.type+'.js');

      if(!fs.existsSync(SIDEWRAP)) {
        debug('call', 'device', device.type, 'hasn\'t been implemented.');

        return 'nil';
      }

      let inst = require(SIDEWRAP);

      device.instance = new inst();
    }

    if(!device.instance[method]) {
      debug('call', method, 'hasn\'t yet been implemented in', device.type);
      return 'nil';
    }

    return device.instance[method](args);
  }
}

module.exports = new Peripheral();
