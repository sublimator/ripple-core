'use strict';

const _ = require('lodash');
const makeClass = require('../make-class');
const {Field} = require('../enums');
const {BinarySerializer} = require('../binary-serializer');
const {ObjectEndMarker} = Field;

const STObject = makeClass({
  static: {
    fromParser(parser, hint_) {
      const hint = typeof hint_ === 'number' ?
                    parser.pos() + hint_ : null;
      const so = new STObject();
      while (!parser.end(hint)) {
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
      throw new Error('unimplemented');
    }
  },
  toJSON() {
    return _.transform(this, (result, value, key) => {
      result[key] = value.toJSON ? value.toJSON() : value;
    });
  },
  toBytesSink(sink) {
    const serializer = new BinarySerializer(sink);
    const fields = Object.keys(this).map((k) => Field[k]).filter(Boolean);
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
