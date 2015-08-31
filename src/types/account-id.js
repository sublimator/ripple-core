'use strict';

const makeClass = require('../make-class');
const {decodeAccountID, encodeAccountID} = require('ripple-address-codec');
const {Hash160} = require('./hash-160');

const AccountID = makeClass({
  AccountID(bytes) {
    Hash160.call(this, bytes);
  },
  extends: Hash160,
  static: {
    from(value) {
      if (typeof value === 'string' && value[0] === 'r') {
        return new this(decodeAccountID(value));
      }
      if (value instanceof this) {
        return value;
      }
      throw new Error('unimplemented');
    }
  },
  toJSON() {
    return encodeAccountID(this._bytes);
  }
});

module.exports = {
  AccountID
};
