/* eslint-disable func-style */

'use strict';

const _ = require('lodash');
const {BinaryParser} = require('./binary-parser');
const {Enums} = require('./binary-definitions');
const types = require('./types');

const widths = {TransactionResult: 1, LedgerEntryType: 2, TransactionType: 2};
const parserType = f => ({fromParser: (p) => f(p)});
const enumType = (k, n, map = Enums[k]) => parserType(p => map[p.readUIntN(n)]);
const accumulator = (to, n, k) => to[k] = enumType(k, n);
const lookup = _.assign(_.transform(widths, accumulator, types));
const makeParser = bytes => new BinaryParser(bytes, lookup);
const readJSON = parser => parser.readType(types.STObject).toJSON();

module.exports = {
  makeParser,
  readJSON
};
