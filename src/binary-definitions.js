'use strict';

const _ = require('lodash');
const {parseBytes} = require('./bytes-utils');
const enums = require('./enums.json');

const {
  TYPES,
  FIELDS,
  TRANSACTION_TYPES,
  TRANSACTION_RESULTS,
  LEDGER_ENTRY_TYPES
} = enums;

function biMap(obj, valueKey) {
  return _.transform(obj, (result, value, key) => {
    const otherKey = !valueKey ? value : value[valueKey];
    const otherValue = !valueKey ? key : value;
    result[key] = value;
    result[otherKey] = otherValue;
  });
}

class Type {
  constructor(definition) {
    _.merge(this, definition);
  }
  toString() {
    return this.name;
  }
}

class Field {
  static header(type, nth) {
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

  constructor(definition) {
    const {type, nth} = definition;
    _.merge(this, definition);
    this.ordinal = type.ordinal << 16 | nth;
  }

  toString() {
    return this.name;
  }
}

const Types = biMap(_.transform(TYPES, (result, ordinal, name) => {
  const type = new Type({name, ordinal});
  result[name] = type;
}), 'ordinal');

const Fields = biMap(_.indexBy(_.map(FIELDS, ([name, definition]) => {
  const type = Types[definition.type];
  const header = Field.header(type.ordinal, definition.nth);
  return new Field(_.assign(definition, {name, type, bytes: header}));
}), 'name'), 'ordinal');

module.exports = {
  Type,
  Types,
  Field,
  Fields,
  Enums: {
    LedgerEntryType: biMap(LEDGER_ENTRY_TYPES),
    TransactionType: biMap(TRANSACTION_TYPES),
    TransactionResult: biMap(TRANSACTION_RESULTS)
  }
};
