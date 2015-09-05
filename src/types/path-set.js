'use strict';
/* eslint-disable no-unused-expressions */

const _ = require('lodash');
const makeClass = require('../make-class');
const {SerializedType, ensureArrayLike} = require('./serialized-type');
const {Currency} = require('./currency');
const {AccountID} = require('./account-id');

const PATHSET_END_BYTE = 0x00;
const PATH_SEPARATOR_BYTE = 0xFF;
const TYPE_ACCOUNT = 0x01;
const TYPE_CURRENCY = 0x10;
const TYPE_ISSUER = 0x20;

const Hop = makeClass({
  static: {
    from(value) {
      if (value instanceof this) {
        return value;
      }
      return _.transform(value, (to, v, k) => {
        switch (k) {
          case 'issuer':
          case 'account':
            to[k] = AccountID.from(v);
            break;
          case 'currency':
            to[k] = Currency.from(v);
            break;
        }
      }, new this());
    },
    parse(parser, type) {
      const hop = new Hop();
      (type & TYPE_ACCOUNT) && (hop.account = AccountID.fromParser(parser));
      (type & TYPE_CURRENCY) && (hop.currency = Currency.fromParser(parser));
      (type & TYPE_ISSUER) && (hop.issuer = AccountID.fromParser(parser));
      return hop;
    }
  },
  toJSON() {
    const type = this.type();
    const ret = {type};
    (type & TYPE_ACCOUNT) && (ret.account = this.account.toJSON());
    (type & TYPE_ISSUER) && (ret.issuer = this.issuer.toJSON());
    (type & TYPE_CURRENCY) && (ret.currency = this.currency.toJSON());
    return ret;
  },
  type() {
    let type = 0;
    this.account && (type += TYPE_ACCOUNT);
    this.issuer && (type += TYPE_ISSUER);
    this.currency && (type += TYPE_CURRENCY);
    return type;
  }
});

const Path = makeClass({
  extends: Array,
  static: {
    from(value) {
      return ensureArrayLike(Path, Hop, value);
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
      return ensureArrayLike(this, Path, value);
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
        const type = hop.type();
        sink.put([type]);
        ['account', 'currency', 'issuer'].forEach(k => {
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
