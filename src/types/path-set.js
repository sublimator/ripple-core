'use strict';
/* eslint-disable no-unused-expressions */

const makeClass = require('../make-class');
const {Currency} = require('./currency');
const {AccountID} = require('./account-id');

const PATHSET_END_BYTE = 0x00;
const PATH_SEPARATOR_BYTE = 0xFF;
const TYPE_ACCOUNT = 0x01;
const TYPE_CURRENCY = 0x10;
const TYPE_ISSUER = 0x20;

const Hop = makeClass({
  static: {
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
  toJSON() {
    return this.map(k => k.toJSON());
  }
});

const PathSet = makeClass({
  extends: Array,
  static: {
    fromParser(parser) {
      const pathSet = new PathSet();
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
          pathSet.push(path = new Path());
        }
        path.push(Hop.parse(parser, type));
      }
      return pathSet;
    }
  },
  toJSON() {
    return this.map(k => k.toJSON());
  }
});

module.exports = {
  PathSet
};
