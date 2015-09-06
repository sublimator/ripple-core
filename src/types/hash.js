'use strict';

const assert = require('assert');
const makeClass = require('../utils/make-class');
const {Comparable, SerializedType} = require('./serialized-type');
const {compareBytes, parseBytes} = require('../utils/bytes-utils');

const Hash = makeClass({
  Hash(bytes) {
    const width = this.constructor.width;
    this._bytes = bytes ? parseBytes(bytes, Uint8Array) :
                          new Uint8Array(width);
    assert.equal(this._bytes.length, width);
  },
  mixin: [Comparable, SerializedType],
  static: {
    width: NaN,
    from(value) {
      if (value instanceof this) {
        return value;
      }
      return new this(parseBytes(value));
    },
    fromParser(parser, hint) {
      return new this(parser.read(hint || this.width));
    }
  },
  compareTo(other) {
    return compareBytes(this._bytes, this.constructor.from(other)._bytes);
  },
  nibblet(depth) {
    const byte_ix = depth > 0 ? (depth / 2) | 0 : 0;
    let b = this._bytes[byte_ix];
    if (depth % 2 === 0) {
      b = (b & 0xF0) >>> 4;
    } else {
      b = b & 0x0F;
    }
    return b;
  }
});

module.exports = {
  Hash
};
