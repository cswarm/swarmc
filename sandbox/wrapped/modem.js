/**
 * Modem API - implemented in JS.
 *
 * @name Modem
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 **/

const request = require('request'),
      debug   = require('debug')('swarmc:wrapped:modem')

module.exports = class Modem {

  constructor() {
    debug('constructed')
  }

  /**
   * Open a "port" to listen on.
   *
   * @param {Number} port - port to listen on.
   * @returns {nil} because he decided it does.
   **/
  open(port) {

    debug('open', 'channel', port);
  }

  /**
   * Stop listening on this port.
   *
   * @param {Number} port - port to stop listening on.
   * @returns {nil} because
   **/
  close() {

  }

  /**
   * Close all open ports.
   *
   * @returns {nil}
   **/
  closeAll() {

  }

  /**
   * Transmit a message to the specified channel.
   *
   * @param {Number} port - channel to send to.
   * @param {Number} rport - reply channel.
   * @param {*} data - data to send.
   *
   * @returns {nil} nothing
   **/
  transmit() {

  }
}
