'use strict';

const {parseBytes, bytesToHex} = require('./bytes-utils');
const makeClass = require('./make-class');

const BytesList = makeClass({
  static: {
    add(bytes) {
      return new BytesList().add(bytes);
    }
  },
  BytesList() {
    this.arrays = [];
    this.length = 0;
  },
  add(bytesArg) {
    const bytes = parseBytes(bytesArg, Uint8Array);
    this.length += bytes.length;
    this.arrays.push(bytes);
    return this;
  },
  toBytes() {
    const concatenated = new Uint8Array(this.length);
    let pointer = 0;
    this.arrays.forEach(arr => {
      concatenated.set(arr, pointer);
      pointer += arr.length;
    });
    return concatenated;
  },
  toHex() {
    return bytesToHex(this.toBytes());
  }
});

module.exports = {
  BytesList
};
