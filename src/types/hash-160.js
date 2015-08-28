'use strict';

const makeClass = require('../make-class');
const {Hash} = require('./hash');

const Hash160 = makeClass({
  extends: Hash,
  static: {width: 20}
});

module.exports = {
  Hash160
};
