'use strict';

const makeClass = require('../make-class');
const {parseBytes, bytesToHex} = require('../bytes-utils');
const {SerializedType} = require('./serialized-type');

const Blob = makeClass({
  mixin: SerializedType,
  Blob(bytes) {
    if (bytes) {
      this._bytes = parseBytes(bytes, Uint8Array);
    } else {
      this._bytes = new Uint8Array(0);
    }
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
  }
});

module.exports = {
  Blob
};
