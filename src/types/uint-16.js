'use strict';

const makeClass = require('../make-class');
const {UInt} = require('./uint');

const UInt16 = makeClass({
  extends: UInt,
  static: {width: 2}
});

module.exports = {
  UInt16
};
