'use strict';

const _ = require('lodash');
const enums = require('./enums');
const {Field} = enums;
const types = require('./types');
const binary = require('./binary');
const {ShaMap} = require('./shamap');
const ledgerHashes = require('./ledger-hashes');
const hashes = require('./hashes');
const signing = require('./signing');
const {HashPrefix} = require('./hash-prefixes');


module.exports = _.assign({
  hashes: _.assign({}, hashes, ledgerHashes),
  binary,
  enums,
  signing,
  Field,
  HashPrefix,
  ShaMap
},
  types
);
