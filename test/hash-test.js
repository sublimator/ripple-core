'use strict';

const assert = require('assert-diff');
const {Hash160, Currency, AccountID} = require('../src');

describe('Hash160', function() {
  it('has a static width membmer', function() {
    assert.equal(Hash160.width, 20);
  });
  it('inherited by subclasses', function() {
    assert.equal(AccountID.width, 20);
    assert.equal(Currency.width, 20);
  });
  it('can be compared against another', function() {
    const h1 = Hash160.from('1000000000000000000000000000000000000000');
    const h2 = Hash160.from('2000000000000000000000000000000000000000');
    const h3 = Hash160.from('0000000000000000000000000000000000000003');
    assert(h1.lessThan(h2));
    assert(h3.lessThan(h2));
  });
});

describe('Currency', function() {
  it('Will have a null iso() for dodgy XRP ', function() {
    const bad = Currency.from('0000000000000000000000005852500000000000');
    assert.equal(bad.iso(), null);
    assert.equal(bad.isNative(), false);
  });
  it('can be constructed from an Array', function() {
    const xrp = Currency.from(new Uint8Array(20));
    assert.equal(xrp.iso(), 'XRP');
  });
  it('throws on invalid reprs', function() {
    assert.throws(() => Currency.from(new Uint8Array(19)));
    assert.throws(() => Currency.from('usd'));
    assert.throws(() => Currency.from(1));
    assert.throws(() => Currency.from(
                        '00000000000000000000000000000000000000m'));
  });
});
