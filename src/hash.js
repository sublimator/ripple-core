'use strict';

const assert = require('assert');
const makeClass = require('./extend-class');
const {compareBytes, parseBytes, bytesToHex} = require('./bytes-utils');

const Hash = makeClass({
  Hash(bytes) {
    this._bytes = parseBytes(bytes, Uint8Array);
    assert.equal(this._bytes.length, this.constructor.width);
  },
  static: {
    width: NaN,
    from(value) {
      if (value instanceof this.constructor) {
        return value;
      }
      return new this(parseBytes(value));
    },
    fromParser(parser, hint) {
      return new this(parser.read(hint || this.width));
    }
  },
  compareTo(other) {
    return compareBytes(this._bytes, other._bytes);
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
    sink.add(this._bytes);
  },
  toJSON() {
    return bytesToHex(this._bytes);
  }
});

const Hash128 = makeClass({
  extends: Hash,
  static: {width: 16}
});
const Hash160 = makeClass({
  extends: Hash,
  static: {width: 20}
});
const Hash256 = makeClass({
  extends: Hash,
  static: {width: 32}
});

module.exports = {
  Hash,
  Hash128,
  Hash160,
  Hash256
};
