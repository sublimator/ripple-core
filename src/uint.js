'use strict';

const BN = require('bn.js');
const makeClass = require('./extend-class');
const {bytesToHex} = require('./bytes-utils');

const UInt = makeClass({
  static: {
    width: undefined,
    from(value) {
      return value;
    },
    fromBytes(bytes) {
      return new this(bytes);
    },
    fromParser(parser) {
      if (this.width === 8) {
        return this.fromBytes(parser.read(this.width));
      }
      return parser.readUIntN(this.width);
    }
  }
});

const UInt8 = makeClass({
  extends: UInt,
  static: {width: 1}
});
const UInt16 = makeClass({
  extends: UInt,
  static: {width: 2}
});
const UInt32 = makeClass({
  extends: UInt,
  static: {width: 4}
});
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
  UInt,
  UInt8,
  UInt16,
  UInt32,
  UInt64
};
