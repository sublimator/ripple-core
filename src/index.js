'use strict';

const _ = require('lodash');
const {Field, Enums} = require('./enums');
const types = require('./types');
const binaryReader = require('./binary-parser');

module.exports = _.assign(
  {Field,
   Enums,
   binary: binaryReader},
  types
);
