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
    cache: {},
    cacheHits: 0,
    cacheMisses: 0,
    useCache: true,
    from(value) {
      return value instanceof this ? value :
              this.useCache && this.cache[value] ?
                  ((++this.cacheHits) && this.cache[value]) :
                      /^r/.test(value) ? this.fromBase58(value) :
                          new this(value);
    },
    fromBase58(value) {
      const acc = new this(decodeAccountID(value));
      if (this.useCache) {
        acc._toBase58 = value;
        this.cache[value] = acc;
      }
      return acc;
    }
  },
  cached: {
    toBase58() {
      return encodeAccountID(this._bytes);
    },
    toJSON() {
      if (!AccountID.useCache) {
        return this.toBase58();
      }
      // Experimental
      const cache = AccountID.cache;
      const hex = this.toHex();
      let cached = cache[hex];
      if (!cached) {
        cached = cache[hex] = this;
        cached._toJSON = cached.toBase58();
        AccountID.cacheMisses++;
      } else {
        AccountID.cacheHits++;
      }
      return cached._toJSON;
    }
  }
});

module.exports = {
  AccountID
};
