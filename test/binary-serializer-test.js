/* eslint-disable func-style */

'use strict';

const assert = require('assert-diff');
const {BytesList} = require('../src/binary-serializer');

function bytesListTest() {
  const list = BytesList.add([0]).add([2, 3]).add([4, 5]);

  it('is an Array<Uint8Array>', function() {
    assert(Array.isArray(list.arrays));
    assert(list.arrays[0] instanceof Uint8Array);
  });
  it('keeps track of the length itself', function() {
    assert.equal(list.length, 5);
  });
  it('can join all arrays into one via toBytes', function() {
    const joined = list.toBytes();
    assert(joined.length, 5);
    assert.deepEqual(joined, [0, 2, 3, 4, 5]);
  });
}

describe('Binary Serialization', function() {
  describe('BytesList', bytesListTest);
});
