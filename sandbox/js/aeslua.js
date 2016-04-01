/**
 * AESLua shim to use native-ness.
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0.0
 * @license MIT
 **/

const crypto = require('crypto');

module.exports = {

  /**
   * Encrypt data.
   *
   * @param {String} password  - shared secret
   * @param {variable} data    - data to encrypt
   * @param {String} keylength - key length to use (128, 256 ...)
   *
   * @returns {Binary} encrypted data.
   **/
  encrypt: (password, data, keylength) => {
    keylength = keylength || '128';
    const cipher = crypto.createCipher('aes'+keylength, password);
    return cipher.update(data)+cipher.final('binary');
  },

  /**
   * Decrypt data.
   *
   * @param {String} password  - shared secret
   * @param {variable} data    - encrypted data
   * @param {String} keylength - keylength (128, 256 ...)
   *
   * @returns {variable} decrypted data.
   */
  decrypt: (password, data, keylength) => {
    keylength = keylength || '128';

    const decipher = crypto.createDecipher('aes'+keylength, password);
    return decipher.update(data)+decipher.final();
  }
}
