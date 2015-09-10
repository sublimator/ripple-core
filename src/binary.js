/* eslint-disable func-style */

'use strict';

const hashjs = require('hash.js');
const types = require('./types');
const {HashPrefix} = require('./hash-prefixes');
const {BinaryParser} = require('./serdes/binary-parser');
const {BinarySerializer, BytesList} = require('./serdes/binary-serializer');
const {bytesToHex, slice, parseBytes} = require('./utils/bytes-utils');

const makeParser = bytes => new BinaryParser(bytes);
const readJSON = parser => parser.readType(types.STObject).toJSON();

function serializeObject(object, {prefix, signingFieldsOnly = false} = {}) {
  const bytesList = new BytesList();
  if (prefix) {
    bytesList.put(prefix);
  }
  const filter = signingFieldsOnly ? f => f.isSigningField : undefined;
  types.STObject.from(object).toBytesSink(bytesList, filter);
  return bytesList.toBytes();
}

function sha512Half(...args) {
  const hash = hashjs.sha512();
  args.forEach(a => hash.update(a));
  return parseBytes(hash.digest().slice(0, 32), Uint8Array);
}

function signingData(tx) {
  return serializeObject(tx, {prefix: HashPrefix.transactionSig,
                              signingFieldsOnly: true});
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
  signingData,
  sha512Half,
  slice
};
