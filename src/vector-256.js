'use strict';

const makeClass = require('./extend-class');
const {Hash256} = require('./hash');

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
    }
  },
  toJSON() {
    return this.map((hash) => hash.toJSON());
  }
});

module.exports = {
  Vector256
};
