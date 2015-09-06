'use strict';
/* eslint-disable no-unused-expressions */

const _ = require('lodash');
const makeClass = require('../make-class');
const {SerializedType, ensureArrayLikeIs} = require('./serialized-type');
const {Currency} = require('./currency');
const {AccountID} = require('./account-id');

const PATHSET_END_BYTE = 0x00;
const PATH_SEPARATOR_BYTE = 0xFF;

const TYPE = {
  account: 0x01,
  currency: 0x10,
  issuer: 0x20
};

const HOP_PROPERTIES = _.keys(TYPE);

const TYPES = {
  issuer: AccountID,
  account: AccountID,
  currency: Currency
};

const Hop = makeClass({
  static: {
    from(value) {
      if (value instanceof this) {
        return value;
      }
      return _.transform(TYPES, (to, Type, k) => {
        (value[k]) && (to[k] = Type.from(value[k]));
      }, new this());
    },
    parse(parser, type) {
      return _.transform(TYPE, (to, v, k) => {
        (type & v) && (to[k] = TYPES[k].fromParser(parser));
      }, new this());
    }
  },
  toJSON() {
    const to = {type: this.type()};
    _.forEach(HOP_PROPERTIES, (k) => {
      (this[k]) && (to[k] = this[k].toJSON());
    });
    return to;
  },
  type() {
    return _.reduce(HOP_PROPERTIES, (a, b) => {
      return a + (this[b] ? TYPE[b] : 0);
    }, 0);
  }
});

const Path = makeClass({
  extends: Array,
  static: {
    from(value) {
      return ensureArrayLikeIs(Path, value).withChildren(Hop);
    }
  },
  toJSON() {
    return this.map(k => k.toJSON());
  }
});

const PathSet = makeClass({
  mixin: SerializedType,
  extends: Array,
  static: {
    from(value) {
      return ensureArrayLikeIs(PathSet, value).withChildren(Path);
    },
    fromParser(parser) {
      const pathSet = new this();
      let path;
      while (!parser.end()) {
        const type = parser.readUInt8();
        if (type === PATHSET_END_BYTE) {
          break;
        }
        if (type === PATH_SEPARATOR_BYTE) {
          path = null;
          continue;
        }
        if (!path) {
          path = new Path();
          pathSet.push(path);
        }
        path.push(Hop.parse(parser, type));
      }
      return pathSet;
    }
  },
  toJSON() {
    return this.map(k => k.toJSON());
  },
  toBytesSink(sink) {
    let n = 0;
    this.forEach((path) => {
      if (n++ !== 0) {
        sink.put([PATH_SEPARATOR_BYTE]);
      }
      path.forEach((hop) => {
        sink.put([hop.type()]);
        HOP_PROPERTIES.forEach(k => {
          if (hop[k]) {
            hop[k].toBytesSink(sink);
          }
        });
      });
    });
    sink.put([PATHSET_END_BYTE]);
  }
});

module.exports = {
  PathSet
};
