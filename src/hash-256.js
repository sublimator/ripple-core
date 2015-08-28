'use strict';

const makeClass = require('./extend-class');
const {Hash} = require('./hash');

const Hash256 = makeClass({
  extends: Hash,
  static: {width: 32}
});

module.exports = {
  Hash256
};
