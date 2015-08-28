'use strict';
const _ = require('lodash');

const {Fields, Enums} = require('./binary-definitions');
const types = require('./types-index');
const binaryReader = require('./binary-reader');

module.exports = _.assign(
  {Fields,
   Enums,
   binary: binaryReader},
  types
);
