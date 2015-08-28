'use strict';

const makeClass = require('./extend-class');

const UInt = makeClass({
  static: {
    width: undefined,
    fromParser(parser) {
      if (this.width > 4) {
        return new this(parser.read(this.width));
      }
      return parser.readUIntN(this.width);
    }
  }
});

module.exports = {
  UInt
};
