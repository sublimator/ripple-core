'use strict';

const makeClass = require('./extend-class');
const {UInt} = require('./uint');

const UInt32 = makeClass({
  extends: UInt,
  static: {width: 4}
});

module.exports = {
  UInt32
};
