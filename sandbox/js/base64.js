/**
 * Base64 support
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0.0
 * @license MIT
 **/

module.exports = {
  
  /**
   * Encode base64 encoded data.
   *
   * @param {variable} data - data to base64 encode
   *
   * @returns {String} base64 encoded data.
   **/
  encode: (data) => {
    return new Buffer(data).toString('base64');
  },

  /**
   * Decode base64 encoded data.
   *
   * @param {String} data - base64 encoded data.
   *
   * @returns {variable} unencoded data.
   **/
  decode: (data) => {
    return new Buffer(data, "base64").toString("utf8");
  }
}
