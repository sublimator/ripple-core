'use strict';

const {parseBytes, bytesToHex} = require('./bytes-utils');

class BytesList {
  static add(bytes) {
    return new BytesList().add(bytes);
  }
  constructor() {
    this.arrays = [];
    this.length = 0;
  }
  add(bytesArg) {
    const bytes = parseBytes(bytesArg, Uint8Array);
    this.length += bytes.length;
    this.arrays.push(bytes);
    return this;
  }
  toBytes() {
    const concatenated = new Uint8Array(this.length);
    let pointer = 0;
    this.arrays.forEach(arr => {
      arr.copyWithin(concatenated, pointer);
      pointer += arr.length;
    });
    return concatenated;
  }
  toHex() {
    return bytesToHex(this.toBytes());
  }
}

module.exports = {
  BytesList
};
