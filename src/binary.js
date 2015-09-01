/* eslint-disable func-style */

'use strict';

const hashjs = require('hash.js');
const types = require('./types');
const {BinaryParser} = require('./binary-parser');
const {BinarySerializer, BytesList} = require('./binary-serializer');
const {bytesToHex, slice, parseBytes} = require('./bytes-utils');

const makeParser = bytes => new BinaryParser(bytes);
const readJSON = parser => parser.readType(types.STObject).toJSON();

function serializeObject(object, prefix, _To) {
  const bytesList = new BytesList();
  const serializer = new BinarySerializer(bytesList);
  const prefixIsTo = typeof prefix === 'function';
  if (prefix && !prefixIsTo) {
    serializer.put(prefix);
  }
  const To = prefixIsTo ? prefix : _To;
  types.STObject.from(object).toBytesSink(serializer);
  return To === 'hex' ? bytesList.toHex() : bytesList.toBytes(To);
}

function sha512Half(...args) {
  const hash = hashjs.sha512();
  args.forEach(a => hash.update(a));
  return new types.Hash256(hash.digest().slice(0, 32));
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
