'use strict';

const assert = require('assert');

function signum(a, b) {
  return a < b ? -1 : a === b ? 0 : 1;
}

const hexLookup = (function() {
  const res = {};
  const reverse = res.reverse = new Array(256);
  for (let i = 0; i < 16; i++) {
    const char = i.toString(16).toUpperCase();
    res[char] = i;

    for (let j = 0; j < 16; j++) {
      const char2 = j.toString(16).toUpperCase();
      const byte = (i << 4) + j;
      const byteHex = char + char2;
      res[byteHex] = byte;
      reverse[byte] = byteHex;
    }
  }
  return res;
}());

const reverseHexLookup = hexLookup.reverse;

function bytesToHex(sequence) {
  const buf = Array(sequence.length);
  for (let i = sequence.length - 1; i >= 0; i--) {
    buf[i] = reverseHexLookup[sequence[i]];
  }
  return buf.join('');
}

function parseBytes(val, Output = Array) {
  if (typeof val === 'string') {
    const start = val.length % 2;
    const res = new Output((val.length + start) / 2);
    for (let i = val.length, to = res.length - 1; to >= 0; i -= 2, to--) {
      res[to] = hexLookup[val.slice(i - 2, i)];
    }
    if (start === 1) {
      res[0] = hexLookup[val[0]];
    }
    return res;
  } else if (val instanceof Output) {
    return val;
  }
  const res = new Output(val.length);
  for (let i = val.length - 1; i >= 0; i--) {
    res[i] = val[i];
  }
  return res;
}

function compareBytes(a, b) {
  assert(a.length === b.length);
  for (let i = 0; i < a.length; i++) {
    const cmp = signum(a[i], b[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return 0;
}

function slice(val, startIx = 0, endIx = val.length, Output = val.constructor) {
  /* eslint-disable no-param-reassign*/
  if (startIx < 0) {
    startIx += val.length;
  }
  if (endIx < 0) {
    endIx += val.length;
  }
  /* eslint-enable no-param-reassign*/
  const len = endIx - startIx;
  const res = new Output(len);
  for (let i = endIx - 1; i >= startIx; i--) {
    res[i - startIx] = val[i];
  }
  return res;
}

module.exports = {
  parseBytes,
  bytesToHex,
  slice,
  compareBytes
};
