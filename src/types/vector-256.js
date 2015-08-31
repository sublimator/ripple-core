'use strict';

const makeClass = require('../make-class');
const {Hash256} = require('./hash-256');

const Vector256 = makeClass({
  extends: Array,
  static: {
    fromParser(parser, hint) {
      const vector256 = new this();
      const bytes = hint !== null ? hint : parser.size() - parser.pos();
      const hashes = bytes / 32;
      for (let i = 0; i < hashes; i++) {
        vector256.push(Hash256.fromParser(parser));
      }
      return vector256;
    },
    from(value) {
      if (value instanceof this) {
        return value;
      }
      throw new Error('unimplemented');
    }
  },
  toBytesSink(sink) {
    this.forEach(h => h.toBytesSink(sink));
  },
  toJSON() {
    return this.map((hash) => hash.toJSON());
  }
});

module.exports = {
  Vector256
};
