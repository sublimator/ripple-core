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
const binaryToJSON = (bytes) => readJSON(makeParser(bytes));

function serializeObject(object, opts = {}) {
  const {prefix, suffix, signingFieldsOnly = false} = opts;
  const bytesList = new BytesList();
  if (prefix) {
    bytesList.put(prefix);
  }
  const filter = signingFieldsOnly ? f => f.isSigningField : undefined;
  types.STObject.from(object).toBytesSink(bytesList, filter);
  if (suffix) {
    bytesList.put(suffix);
  }
  return bytesList.toBytes();
}

function sha512Half(...args) {
  const hash = hashjs.sha512();
  args.forEach(a => hash.update(a));
  return parseBytes(hash.digest().slice(0, 32), Uint8Array);
}

function signingData(tx, prefix = HashPrefix.transactionSig) {
  return serializeObject(tx, {prefix, signingFieldsOnly: true});
}

function multiSigningData(tx, signingAccount) {
  const prefix = HashPrefix.transactionMultiSig;
  const suffix = types.AccountID.from(signingAccount).toBytes();
  return serializeObject(tx, {prefix, suffix, signingFieldsOnly: true});
}

function transactionID(serialized) {
  return sha512Half(HashPrefix.transactionID, serialized);
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
  multiSigningData,
  signingData,
  binaryToJSON,
  sha512Half,
  transactionID,
  slice
};
