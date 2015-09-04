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
              /^r/.test(value) ? this.fromBase58(value) :
                    new this(value);
    },
    fromBase58(value) {
      const acc = new this(decodeAccountID(value));
      acc._toBase58 = value;
      return acc;
    }
  },
  cached: {
    toBase58() {
      return encodeAccountID(this._bytes);
    },
    toJSON() {
      return this.toBase58();
    }
  }
});

module.exports = {
  AccountID
};
