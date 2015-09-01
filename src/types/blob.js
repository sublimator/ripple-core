'use strict';

const makeClass = require('../make-class');
const {parseBytes, bytesToHex} = require('../bytes-utils');

const Blob = makeClass({
  Blob(bytes) {
    if (bytes) {
      this._bytes = parseBytes(bytes, Uint8Array);
    } else {
      this._bytes = new Uint8Array(0);
    }
  },
  toBytesSink(sink) {
    sink.put(this._bytes);
  },
  static: {
    fromParser(parser, hint) {
      return new this(parser.read(hint));
    },
    from(value) {
      if (value instanceof this) {
        return value;
      }
      return new this(value);
    }
  },
  toJSON() {
    return this.toHex();
  },
  toHex() {
    return bytesToHex(this._bytes);
  },
  toBytes() {
    return this._bytes;
  }
});

module.exports = {
  Blob
};
