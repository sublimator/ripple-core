'use strict';

const assert = require('assert');
const makeClass = require('../make-class');
const {compareBytes, parseBytes, bytesToHex} = require('../bytes-utils');

const Hash = makeClass({
  Hash(bytes) {
    const width = this.constructor.width;
    this._bytes = bytes ? parseBytes(bytes, Uint8Array) :
                          new Uint8Array(width);
    assert.equal(this._bytes.length, width);
  },
  static: {
    width: NaN,
    from(value) {
      if (typeof value === 'object' && value instanceof this) {
        return value;
      }
      return new this(parseBytes(value));
    },
    fromParser(parser, hint) {
      return new this(parser.read(hint || this.width));
    }
  },
  compareTo(other) {
    return compareBytes(this._bytes,
                        this.constructor.from(other)._bytes);
  },
  lessThan(other) {
    return this.compareTo(other) === -1;
  },
  equalTo(other) {
    return this.compareTo(other) === 0;
  },
  greaterThan(other) {
    return this.compareTo(other) === 1;
  },
  toBytesSink(sink) {
    sink.put(this._bytes);
  },
  toJSON() {
    return this.toHex();
  },
  toHex() {
    return bytesToHex(this._bytes);
  }
});

module.exports = {
  Hash
};
