'use strict';

const _ = require('lodash');
const makeClass = require('./extend-class');
const {fields} = require('./binary-definitions');
const {ObjectEndMarker} = fields;

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
    }
  },
  toJSON() {
    return _.transform(this, (result, value, key) => {
      result[key] = value.toJSON ? value.toJSON() : value;
    });
  }
});

module.exports = {
  STObject
};
