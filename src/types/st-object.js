'use strict';

const _ = require('lodash');
const makeClass = require('../make-class');
const {Field} = require('../enums');
const {BinarySerializer} = require('../binary-serializer');
const {ObjectEndMarker} = Field;

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
      result[key] = value.toJSON ? value.toJSON() : value;
    });
  },
  toBytesSink(sink) {
    const serializer = new BinarySerializer(sink);
    const fields = this.fieldKeys();
    const sorted = _.sortBy(fields, 'ordinal');
    sorted.forEach((field) => {
      const value = this[field];
      serializer.writeFieldAndValue(field, value);
    });
  }
});

module.exports = {
  STObject
};
