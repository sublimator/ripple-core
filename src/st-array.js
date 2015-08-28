'use strict';

const makeClass = require('./extend-class');
const {Fields} = require('./binary-definitions');
const {STObject} = require('./st-object');
const {ArrayEndMarker} = Fields;

const STArray = makeClass({
  extends: Array,
  static: {
    fromParser(parser) {
      const array = new STArray();
      while (!parser.end()) {
        const field = parser.readField();
        if (field === ArrayEndMarker) {
          break;
        }
        const outer = new STObject();
        outer[field] = parser.readFieldValue(field);
        array.push(outer);
      }
      return array;
    }
  },
  toJSON() {
    return this.map((v) => v.toJSON());
  }
});

module.exports = {
  STArray
};
