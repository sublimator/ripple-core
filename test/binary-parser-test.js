'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const {BinaryParser} = require('../src/binary-parser');
const {bytesToHex} = require('../src/bytes-utils');
const {encodeAccountID} = require('ripple-address-codec');
const {parseHexOnly, assertEqualAmountJSON, loadFixture} = require('./utils');
const index = require('../src');
const {fields, Amount, Hash160} = index;

const fixtures = loadFixture('data-driven-tests.json');

function buildLookup() {
  const TransactionType = {
    fromParser(parser) {
      return {0: 'Payment',
              1: 'Claim',
              2: 'WalletAdd',
              3: 'AccountSet',
              4: 'PasswordFund',
              5: 'SetRegularKey',
              6: 'NickNameSet',
              7: 'OfferCreate',
              8: 'OfferCancel',
              9: 'Contract',
             10: 'TicketCreate',
             11: 'TicketCancel',
             20: 'TrustSet',
            100: 'EnableAmendment',
            101: 'SetFee'}[parser.readUInt16() ];
    }
  };
  return _.assign({TransactionType}, index);
}

function toJSON(v) {
  return v.toJSON ? v.toJSON() : v;
}

function makeParser(bytes) {
  return new BinaryParser(bytes, buildLookup());
}

function basicApiTests() {
  const bytes = parseHexOnly('00,01020304,0506', Uint8Array);
  it('can read slices of bytes', () => {
    const parser = makeParser(bytes);
    assert.deepEqual(parser.pos(), 0);
    assert(parser._buf instanceof Uint8Array);
    const read1 = parser.read(1);
    assert(read1 instanceof Uint8Array);
    assert.deepEqual(read1, [0]);
    assert.deepEqual(parser.read(4), [1, 2, 3, 4]);
    assert.deepEqual(parser.read(2), [5, 6]);
    assert.throws(() => parser.read(1));
  });
  it('can read a Uint32 at full', () => {
    const parser = makeParser('FFFFFFFF');
    assert.equal(parser.readUInt32(), 0xFFFFFFFF);
  });
}

function transactionParsingTests() {
  const transaction = {
    /* eslint-disable max-len */
    json: {
      'Account': 'raD5qJMAShLeHZXf9wjUmo6vRK4arj9cF3',
      'Fee': '10',
      'Flags': 0,
      'Sequence': 103929,
      'SigningPubKey':
        '028472865AF4CB32AA285834B57576B7290AA8C31B459047DB27E16F418D6A7166',
      'TakerGets': {'currency': 'ILS',
                   'issuer': 'rNPRNzBB92BVpAhhZr4iXDTveCgV5Pofm9',
                   'value': '1694.768'},
      'TakerPays': '98957503520',
      'TransactionType': 'OfferCreate',
      'TxnSignature':
          '304502202ABE08D5E78D1E74A4C18F2714F64E87B8BD57444AFA5733109EB3C077077520022100DB335EE97386E4C0591CAC024D50E9230D8F171EEB901B5E5E4BD6D1E0AEF98C'
    },
    /* eslint-disable max-len */
    binary: parseHexOnly(`
      120007220000000024000195F964400000170A53AC2065D5460561E
      C9DE000000000000000000000000000494C53000000000092D70596
      8936C419CE614BF264B5EEB1CEA47FF468400000000000000A73210
      28472865AF4CB32AA285834B57576B7290AA8C31B459047DB27E16F
      418D6A71667447304502202ABE08D5E78D1E74A4C18F2714F64E87B
      8BD57444AFA5733109EB3C077077520022100DB335EE97386E4C059
      1CAC024D50E9230D8F171EEB901B5E5E4BD6D1E0AEF98C811439408
      A69F0895E62149CFCC006FB89FA7D1E6E5D`)
  };

  const tx_json = transaction.json;
  // These tests are basically development logs

  it('can be done with low level apis', () => {
    const parser = makeParser(transaction.binary);

    assert.equal(parser.readField(), fields.TransactionType);
    assert.equal(parser.readUInt16(), 7);
    assert.equal(parser.readField(), fields.Flags);
    assert.equal(parser.readUInt32(), 0);
    assert.equal(parser.readField(), fields.Sequence);
    assert.equal(parser.readUInt32(), 103929);
    assert.equal(parser.readField(), fields.TakerPays);
    parser.read(8);
    assert.equal(parser.readField(), fields.TakerGets);
    // amount value
    assert(parser.read(8));
    // amount currency
    assert(Hash160.fromParser(parser));
    assert.equal(encodeAccountID(parser.read(20)),
                 tx_json.TakerGets.issuer);
    assert.equal(parser.readField(), fields.Fee);
    assert(parser.read(8));
    assert.equal(parser.readField(), fields.SigningPubKey);
    assert.equal(parser.readVLLength(), 33);
    assert.equal(bytesToHex(parser.read(33)), tx_json.SigningPubKey);
    assert.equal(parser.readField(), fields.TxnSignature);
    assert.equal(bytesToHex(parser.readVL()), tx_json.TxnSignature);
    assert.equal(parser.readField(), fields.Account);
    assert.equal(encodeAccountID(parser.readVL()), tx_json.Account);
    assert(parser.end());
  });

  it('can be done with high level apis', () => {
    const parser = makeParser(transaction.binary);
    function readField() {
      return parser.readFieldValue();
    }
    assert.deepEqual(readField(), [fields.TransactionType, 'OfferCreate']);
    assert.deepEqual(readField(), [fields.Flags, 0]);
    assert.deepEqual(readField(), [fields.Sequence, 103929]);
    {
      const [field, value] = readField();
      assert.equal(field, fields.TakerPays);
      assert.equal(value.currency.isNative(), true);
      assert.equal(value.currency.toJSON(), 'XRP');
    }
    {
      const [field, value] = readField();
      assert.equal(field, fields.TakerGets);
      assert.equal(value.currency.isNative(), false);
      assert.equal(value.issuer.toJSON(), tx_json.TakerGets.issuer);
    }
    {
      const [field, value] = readField();
      assert.equal(field, fields.Fee);
      assert.equal(value.currency.isNative(), true);
    }
    {
      const [field, value] = readField();
      assert.equal(field, fields.SigningPubKey);
      assert.equal(value.toJSON(), tx_json.SigningPubKey);
    }
    {
      const [field, value] = readField();
      assert.equal(field, fields.TxnSignature);
      assert.equal(value.toJSON(), tx_json.TxnSignature);
    }
    {
      const [field, value] = readField();
      assert.equal(field, fields.Account);
      assert.equal(value.toJSON(), tx_json.Account);
    }
    assert(parser.end());
  });
  it('can be done with higher level apis', () => {
    const parser = makeParser(transaction.binary);
    function readJSON() {
      const json = {};
      while (!parser.end()) {
        const [field, value] = parser.readFieldValue();
        json[field] = value.toJSON ? value.toJSON() : value;
      }
      return json;
    }
    const jsonFromBinary = readJSON();
    assert.deepEqual(jsonFromBinary, tx_json);
  });
}

function amountParsingTests() {
  _.filter(fixtures.values_tests, {type: 'Amount'}).forEach((f) => {
    if (f.error) {
      return;
    }
    const parser = makeParser(f.expected_hex);
    const testName =
      `parses ${f.expected_hex.slice(0, 16)}...
          as ${JSON.stringify(f.test_json)}`;

    it(testName, () => {
      const value = parser.readType(Amount);
      // May not actually be in canonical form. The fixtures are to be used
      // also for json -> binary;
      assertEqualAmountJSON(toJSON(value), f.test_json);
    });
  });
}

function fieldParsingTests() {
  fixtures.fields_tests.forEach((f) => {
    const parser = makeParser(f.expected_hex);
    it(`parses ${f.expected_hex} as ${f.name}`, () => {
      const field = parser.readField();
      assert.equal(field.name, f.name);
      assert.equal(field.type.name, f.type_name);
    });
  });
}

function nestedObjectTests() {
  function disabled(i) {
    return _.includes([2], i);
  }

  fixtures.whole_objects.forEach((f, i) => {
    if (disabled(i)) {
      return;
    }
    const parser = makeParser(f.blob_with_no_signing);
    it(`can parse whole_objects[${i}] blob into
          ${JSON.stringify(f.tx_json)}`,
    /*                                              */ () => {

      let ix = 0;
      while (!parser.end()) {
        const [field, value] = parser.readFieldValue();
        const expectedJSON = f.fields[ix][1].json;
        const expectedField = f.fields[ix][0];

        const actual = toJSON(value);
        try {
          assert.deepEqual(actual, expectedJSON);
        } catch (e) {
          throw new Error(`${e} ${field} a: ${actual} e: ${expectedJSON}`);
        }
        assert.equal(field.name, expectedField);
        ix++;
      }
    });
  });
}

function dataDrivenTests() {
  describe('Amount parsing tests', amountParsingTests);
  describe('Field Tests', fieldParsingTests);
  describe('Parsing nested objects', nestedObjectTests);
}

describe('BinaryParser', function() {
  describe('Basic API', basicApiTests);
  describe('Parsing a transction', transactionParsingTests);
  describe('Data Driven Tests', dataDrivenTests);
});
