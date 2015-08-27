'use strict';

const assert = require('assert');
const Decimal = require('decimal.js');
const fs = require('fs');
const {parseBytes} = require('../src/bytes-utils');

function parseHexOnly(hex, to) {
  return parseBytes(hex.replace(/[^a-fA-F0-9]/g, ''), to);
}

function loadFixture(relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath;
  return JSON.parse(fs.readFileSync(fn).toString());
}

function assertEqualAmountJSON(actual, expected) {
  const typeA = (typeof actual);
  assert(typeA === (typeof expected));
  if (typeA === 'string') {
    assert.equal(actual, expected);
    return;
  }
  assert.equal(actual.currency, expected.currency);
  assert.equal(actual.issuer, expected.issuer);
  assert(actual.value === expected.value ||
            new Decimal(actual.value).equals(
                    new Decimal(expected.value)));
}

module.exports = {
  parseHexOnly,
  loadFixture,
  assertEqualAmountJSON
};
