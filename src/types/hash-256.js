'use strict';

const makeClass = require('../make-class');
const {Hash} = require('./hash');

const Hash256 = makeClass({
  extends: Hash,
  static: {
    width: 32,
    init() {
      this.ZERO_256 = new this(new Uint8Array(this.width));
    }
  }
});

module.exports = {
  Hash256
};
