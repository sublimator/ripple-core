'use strict';

const BN = require('bn.js');
const makeClass = require('../make-class');
const {bytesToHex} = require('../bytes-utils');
const {UInt} = require('./uint');

const UInt64 = makeClass({
  extends: UInt,
  static: {width: 8},
  UInt64(bytes) {
    this._bytes = bytes;
  },
  toJSON() {
    return bytesToHex(this._bytes);
  },
  toBN() {
    return new BN(this._bytes);
  }
});

module.exports = {
  UInt64
};
