'use strict';

const _ = require('lodash');
const {Field, Enums} = require('./enums');
const types = require('./types');
const binary = require('./binary');

module.exports = _.assign(
  {Field,
   Enums,
   binary},
  types
);
