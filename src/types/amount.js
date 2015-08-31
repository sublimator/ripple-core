'use strict';

const BN = require('bn.js');
const Decimal = require('decimal.js');
const makeClass = require('../make-class');
const {bytesToHex} = require('../bytes-utils');
const {Currency} = require('./currency');
const {AccountID} = require('./account-id');
const {UInt64} = require('./uint-64');

Decimal.config({
  toExpPos: 32,
  toExpNeg: -32
});

const Amount = makeClass({
  Amount(value, currency, issuer) {
    this.value = value || new Decimal('0');
    this.currency = currency || Currency.XRP;
    this.issuer = issuer || null;
  },
  static: {
    from(value) {
      if (value instanceof this) {
        return value;
      }
      throw new Error('unimplemented');
    },
    fromParser(parser) {
      const mantissa = parser.read(8);
      const b1 = mantissa[0];
      const b2 = mantissa[1];

      const isIOU = b1 & 0x80;
      const isPositive = b1 & 0x40;
      const sign = isPositive ? '+' : '-';

      if (isIOU) {
        mantissa[0] = 0;
        const currency = parser.readType(Currency);
        const issuer = parser.readType(AccountID);
        const exponent = ((b1 & 0x3F) << 2) + ((b2 & 0xff) >> 6) - 97;
        mantissa[1] &= 0x3F;
        // decimal.js won't accept e notation with hex
        const value = new Decimal(sign + bytesToHex(mantissa), 16)
                                 .times('1e' + exponent);
        return new this(value, currency, issuer);
      }

      mantissa[0] &= 0x3F;
      const drops = new Decimal(sign + bytesToHex(mantissa), 16);
      const xrpValue = drops.dividedBy('1e6');
      return new this(xrpValue, Currency.XRP);
    }
  },
  isNative() {
    return this.currency.isNative();
  },
  mantissa() {
    return new UInt64(
      new BN(this.value.times('1e' + -this.exponent()).abs().toString()));
  },
  isZero() {
    return this.value.isZero();
  },
  exponent() {
    return this.isNative() ? -6 : this.value.e - 15;
  },
  toBytesSink(sink) {
    const isNative = this.isNative();
    const notNegative = !this.value.isNegative();
    const mantissa = this.mantissa().toBytes();

    if (isNative) {
      mantissa[0] |= notNegative ? 0x40 : 0;
      sink.put(mantissa);
    } else {
      mantissa[0] |= 0x80;
      if (!this.isZero()) {
        if (notNegative) {
          mantissa[0] |= 0x40;
        }
        const exponent = this.value.e - 15;
        const exponentByte = 97 + exponent;
        mantissa[0] |= (exponentByte >>> 2);
        mantissa[1] |= (exponentByte & 0x03) << 6;
      }
      sink.put(mantissa);
      this.currency.toBytesSink(sink);
      this.issuer.toBytesSink(sink);
    }
  },
  toJSON() {
    if (this.isNative()) {
      return this.value.times('1e6').toString();
    }
    return {
      value: this.value.toString(),
      currency: this.currency.toJSON(),
      issuer: this.issuer.toJSON()
    };
  }
});

module.exports = {
  Amount
};
