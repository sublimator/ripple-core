/* eslint-disable func-style */

'use strict';

const hashjs = require('hash.js');
const types = require('./types');
const {BinaryParser} = require('./binary-parser');
const {BinarySerializer, BytesList} = require('./binary-serializer');
const {bytesToHex, slice, parseBytes} = require('./bytes-utils');

const makeParser = bytes => new BinaryParser(bytes);
const readJSON = parser => parser.readType(types.STObject).toJSON();

function serializeObject(object, prefix) {
  const bytesList = new BytesList();
  const serializer = new BinarySerializer(bytesList);
  if (prefix) {
    serializer.put(prefix);
  }
  types.STObject.from(object).toBytesSink(serializer);
  return bytesList.toBytes();
}

function sha512Half(...args) {
  const hash = hashjs.sha512();
  args.forEach(a => hash.update(a));
  return parseBytes(hash.digest().slice(0, 32), Uint8Array);
}

module.exports = {
  BinaryParser,
  BinarySerializer,
  BytesList,
  makeParser,
  serializeObject,
  readJSON,
  bytesToHex,
  parseBytes,
  sha512Half,
  slice
};
