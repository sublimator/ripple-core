/* eslint-disable func-style */

'use strict';

const _ = require('lodash');
const {BinaryParser} = require('./binary-parser');
const {Enums} = require('./binary-definitions');
const types = require('./types-index');

function buildEnumType(k, bytes) {
  const enumMap = Enums[k];
  const fromParser = parser => enumMap[parser.readUIntN(bytes)];
  return {fromParser};
}

const TransactionResult = buildEnumType('TransactionResult', 1);
const LedgerEntryType = buildEnumType('LedgerEntryType', 2);
const TransactionType = buildEnumType('TransactionType', 2);
const lookup = {TransactionResult, LedgerEntryType, TransactionType};
_.assign(lookup, types);

function toJSON(v) {
  return v.toJSON ? v.toJSON() : v;
}

function readJSON(parser) {
  const json = {};
  while (!parser.end()) {
    const [field, value] = parser.readFieldAndValue();
    json[field] = toJSON(value);
  }
  return json;
}

function makeParser(bytes) {
  return new BinaryParser(bytes, lookup);
}

module.exports = {
  makeParser,
  readJSON
};
