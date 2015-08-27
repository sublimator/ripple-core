'use strict';

const makeClass = require('./extend-class');
const {decodeAccountID, encodeAccountID} = require('ripple-address-codec');
const {Hash160} = require('./hash');

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
      return value;
    }
  },
  toJSON() {
    return encodeAccountID(this._bytes);
  },
  toSink(sink) {
    sink.addBytes(this._bytes);
  }
});

module.exports = {
  AccountID
};
