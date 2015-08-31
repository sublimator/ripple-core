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
      return value instanceof this ? value :
              new this(/^r/.test(value) ? decodeAccountID(value) :
                        value);
    }
  },
  cached: {
    toJSON() {
      return encodeAccountID(this._bytes);
    }
  }
});

module.exports = {
  AccountID
};
