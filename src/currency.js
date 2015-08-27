'use strict';

const _ = require('lodash');
const makeClass = require('./extend-class');
const {slice} = require('./bytes-utils');
const {Hash160} = require('./hash');

const Currency = makeClass({
  extends: Hash160,
  getters: ['isNative', 'iso'],
  Currency(bytes) {
    Hash160.call(this, bytes);
    this.classify();
  },
  classify() {
    let isNormal = true;
    const bytes = this._bytes;
    const code = slice(this._bytes, 12, 15, Array);
    const iso = code.map(c => String.fromCharCode(c)).join('');
    for (let i = bytes.length - 1; i >= 0; i--) {
      if (bytes[i] !== 0 && !(i === 12 || i === 13 || i === 14)) {
        isNormal = false;
        break;
      }
    }
    this._isNative = isNormal && _.isEqual(code, [0, 0, 0]);
    this._iso = this._isNative ? 'XRP' : iso.match(/[A-Z]{3}/) ? iso : null;
  },
  toJSON() {
    if (this.iso()) {
      return this.iso();
    }
    return super.toJSON();
  }
});

Currency.XRP = new Currency(new Uint8Array(20));

module.exports = {
  Currency
};
