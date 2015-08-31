'use strict';

const assert = require('assert');
const BN = require('bn.js');
const makeClass = require('../make-class');
const {bytesToHex, parseBytes, serializeUIntN} = require('../bytes-utils');
const {UInt} = require('./uint');

const UInt64 = makeClass({
  extends: UInt,
  static: {width: 8},
  UInt64(arg = 0) {
    const argType = typeof arg;
    if (argType === 'number') {
      assert(arg >= 0);
      this._bytes = new Uint8Array(8);
      this._bytes.set(serializeUIntN(arg, 4), 4);
    } else if (arg instanceof BN) {
      this._bytes = parseBytes(arg.toArray('be', 8), Uint8Array);
      this._numeric = arg;
    } else {
      if (argType === 'string') {
        assert(arg.match(/[A-F]{16}/));
      }
      this._bytes = parseBytes(arg, Uint8Array);
    }
    assert(this._bytes.length === 8);
  },
  toJSON() {
    return bytesToHex(this._bytes);
  },
  cached: {
    numeric() {
      return new BN(this._bytes);
    }
  },
  toBytes() {
    return this._bytes;
  }
});

module.exports = {
  UInt64
};
