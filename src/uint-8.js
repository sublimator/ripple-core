'use strict';

const makeClass = require('./extend-class');
const {UInt} = require('./uint');

const UInt8 = makeClass({
  extends: UInt,
  static: {width: 1}
});

module.exports = {
  UInt8
};
