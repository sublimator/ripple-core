'use strict';

// const assert = require('assert');
const _ = require('lodash');
const makeClass = require('../make-class');
const {Field} = require('../enums');
const {BinarySerializer} = require('../binary-serializer');
const {ObjectEndMarker} = Field;

// const Payment = _.map([
//   'Account',
//   'Amount',
//   'Destination',
//   'Fee',
//   'Flags',
//   'Sequence',
//   'TransactionType',
//   'SigningPubKey',
//   'TxnSignature'
// ], (f) => Field[f]);

const STObject = makeClass({
  static: {
    fromParser(parser, hint) {
      const end = typeof hint === 'number' ? parser.pos() + hint : null;
      const so = new this();
      while (!parser.end(end)) {
        const field = parser.readField();
        if (field === ObjectEndMarker) {
          break;
        }
        so[field] = parser.readFieldValue(field);
      }
      return so;
    },
    from(value) {
      if (value instanceof this) {
        return value;
      }
      if (typeof value === 'object') {
        return _.transform(value, (so, val, key) => {
          const field = Field[key];
          if (field) {
            so[field] = field.associatedType.from(val);
          } else {
            so[key] = val;
          }
        }, new this());
      }
      throw new Error(`${value} is unsupported`);
    }
  },
  fieldKeys() {
    return Object.keys(this).map((k) => Field[k]).filter(Boolean);
  },
  toJSON() {
    return _.transform(this, (result, value, key) => {
      result[key] = value && value.toJSON ? value.toJSON() : value;
    });
  },
  // formatted() {
  //   if (String(this.TransactionType) === 'Payment') {
  //     Object.defineProperty(this, 'format', {
  //       enumerable: false,
  //       value: Payment
  //     });
  //     Payment.forEach((f) => {
  //       let value = this[f];
  //       Object.defineProperty(this, f.name, {
  //         enumerable: true,
  //         configurable: false,
  //         get() {
  //           return value;
  //         },
  //         set(newValue) {
  //           try {
  //             assert(newValue !== undefined, 'setting undefined');
  //             value = f.associatedType.from(newValue);
  //           } catch (e) {
  //             throw new Error(`{\`${f} = ${newValue}\`: ${e}}`);
  //           }
  //         }
  //       });
  //     });
  //     // Don't allow any other properties to be set
  //     Object.seal(this);
  //     return this;
  //   }
  //   throw new Error('unimplemented');
  // },
  toBytesSink(sink) {
    const serializer = new BinarySerializer(sink);
    const fields = this.fieldKeys();
    const sorted = _.sortBy(fields, 'ordinal');
    sorted.forEach((field) => {
      const value = this[field];
      // const haveValue = value !== undefined;
      // if (!haveValue) {
      //   // if (this.format /* && field optional for format */) {
      //     // return;
      //   // }
      //   throw new Error(`${field} value: ${value} can't serialize`);
      // }
      serializer.writeFieldAndValue(field, value);
    });
  }
});

module.exports = {
  STObject
};
