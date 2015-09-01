'use strict';

const assert = require('assert');
const _ = require('lodash');
const {parseBytes, serializeUIntN} = require('./bytes-utils');
const makeClass = require('./make-class');
const enums = require('./enum-definitions.json');

function biMap(obj, valueKey) {
  return _.transform(obj, (result, value, key) => {
    result[key] = value;
    result[value[valueKey]] = value;
  });
}

const EnumType = makeClass({
  EnumType(definition) {
    _.assign(this, definition);
    // At minimum
    assert(this.bytes instanceof Uint8Array);
    assert(typeof this.ordinal === 'number');
    assert(typeof this.name === 'string');
  },
  toString() {
    return this.name;
  },
  toJSON() {
    return this.name;
  },
  toBytesSink(sink) {
    sink.put(this.bytes);
  },
  static: {
    ordinalByteWidth: 1,
    fromParser(parser) {
      return this.from(parser.readUIntN(this.ordinalByteWidth));
    },
    from(val) {
      const ret = val instanceof this ? val : this[val];
      if (!ret) {
        throw new Error(
          `${val} is not a valid name or ordinal for ${this.enumName}`);
      }
      return ret;
    },
    valuesByName() {
      return _.transform(this.initVals, (result, ordinal, name) => {
        const bytes = serializeUIntN(ordinal, this.ordinalByteWidth);
        const type = new this({name, ordinal, bytes});
        result[name] = type;
      });
    },
    init() {
      const mapped = this.valuesByName();
      _.assign(this, biMap(mapped, 'ordinal'));
      this.values = _.values(mapped);
      return this;
    }
  }
});

const Type = makeClass({
  extends: EnumType,
  static: {
    enumName: 'Type',
    initVals: enums.TYPES
  }
});

const LedgerEntryType = makeClass({
  extends: EnumType,
  static: {
    enumName: 'LedgerEntryType',
    initVals: enums.LEDGER_ENTRY_TYPES,
    ordinalByteWidth: 2
  }
});

const TransactionType = makeClass({
  extends: EnumType,
  static: {
    enumName: 'TransactionType',
    initVals: enums.TRANSACTION_TYPES,
    ordinalByteWidth: 2
  }
});

const TransactionResult = makeClass({
  extends: EnumType,
  static: {
    enumName: 'TransactionResult',
    initVals: enums.TRANSACTION_RESULTS,
    ordinalByteWidth: 1
  }
});

const Field = makeClass({
  extends: EnumType,
  static: {
    enumName: 'Field',
    initVals: enums.FIELDS,
    valuesByName() {
      const fields = _.map(this.initVals, ([name, definition]) => {
        const type = Type[definition.type];
        const bytes = this.header(type.ordinal, definition.nth);
        const ordinal = type.ordinal << 16 | definition.nth;
        const extra = {ordinal, name, type, bytes};
        return new this(_.assign(definition, extra));
      });
      return _.indexBy(fields, 'name');
    },
    header(type, nth) {
      const name = nth;
      const header = [];
      const push = header.push.bind(header);
      if (type < 16) {
        if (name < 16) {
          push(type << 4 | name);
        } else {
          push(type << 4, name);
        }
      } else if (name < 16) {
        push(name, type);
      } else {
        push(0, type, name);
      }
      return parseBytes(header, Uint8Array);
    }
  },
  toString() {
    return this.name;
  }
});

const Enums = {
  LedgerEntryType,
  TransactionType,
  TransactionResult
};

module.exports = {
  Type,
  Field,
  Enums
};
