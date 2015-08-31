'use strict';

const assert = require('assert');
const _ = require('lodash');
const {parseBytes, serializeUIntN} = require('./bytes-utils');
const makeClass = require('./make-class');
const enums = require('./enum-definitions.json');

function biMap(obj, valueKey) {
  return _.transform(obj, (result, value, key) => {
    const otherKey = value[valueKey];
    const otherValue = value;
    result[key] = value;
    result[otherKey] = otherValue;
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
      return this[parser.readUIntN(this.ordinalByteWidth)];
    },
    from(val) {
      return val instanceof this ? val : this[val];
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
      this.values = _.values(mapped).filter(v => v instanceof this);
      return this;
    }
  }
});

const Type = makeClass({
  extends: EnumType,
  static: {initVals: enums.TYPES}
});

const LedgerEntryType = makeClass({
  extends: EnumType,
  static: {
    initVals: enums.LEDGER_ENTRY_TYPES,
    ordinalByteWidth: 2
  }
});

const TransactionType = makeClass({
  extends: EnumType,
  static: {
    initVals: enums.TRANSACTION_TYPES,
    ordinalByteWidth: 2
  }
});

const TransactionResult = makeClass({
  extends: EnumType,
  static: {
    initVals: enums.TRANSACTION_RESULTS,
    ordinalByteWidth: 1
  }
});

const Field = makeClass({
  extends: EnumType,
  static: {
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
      const add = header.push.bind(header);
      if (type < 16) {
        if (name < 16) {
          add(type << 4 | name);
        } else {
          add(type << 4, name);
        }
      } else if (name < 16) {
        add(name, type);
      } else {
        add(0, type, name);
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

module.exports = _.assign({
  Type,
  Field,
  Enums
}, Enums);
