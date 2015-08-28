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

function unused() {}

function buildLookup() {
  const LedgerEntryType = {
    fromParser(parser) {
      const lookup = {
        a: 'AccountRoot',
        d: 'DirectoryNode',
        g: 'GeneratorMap',
        r: 'RippleState',
        o: 'Offer',
        c: 'Contract',
        h: 'LedgerHashes',
        f: 'EnabledAmendments',
        s: 'FeeSettings',
        T: 'Ticket'
      };
      return lookup[String.fromCharCode(parser.readUInt16())];
    }
  };

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
  return _.assign({LedgerEntryType, TransactionType}, index);
}

function readJSON(parser) {
  const json = {};
  while (!parser.end()) {
    const [field, value] = parser.readFieldAndValue();
    json[field] = value.toJSON ? value.toJSON() : value;
  }
  return json;
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
      return parser.readFieldAndValue();
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
    const jsonFromBinary = readJSON(parser);
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
    unused(i);
    return false; // !_.includes([2], i);
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
        const [field, value] = parser.readFieldAndValue();
        if (value === null) {
          continue;
        }

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

function pathSetBinaryTests() {
  const bytes = parseHexOnly(
    `1200002200000000240000002E2E00004BF161D4C71AFD498D00000000000000
     0000000000000055534400000000000A20B3C85F482532A9578DBB3950B85CA0
     6594D168400000000000000A69D446F8038585E9400000000000000000000000
     00425443000000000078CA21A6014541AB7B26C3929B9E0CD8C284D61C732103
     A4665B1F0B7AE2BCA12E2DB80A192125BBEA660F80E9CEE137BA444C1B0769EC
     7447304502205A964536805E35785C659D1F9670D057749AE39668175D6AA75D
     25B218FE682E0221009252C0E5DDD5F2712A48F211669DE17B54113918E0D2C2
     66F818095E9339D7D3811478CA21A6014541AB7B26C3929B9E0CD8C284D61C83
     140A20B3C85F482532A9578DBB3950B85CA06594D1011231585E1F3BD02A15D6
     185F8BB9B57CC60DEDDB37C10000000000000000000000004254430000000000
     585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C131E4FE687C90257D3D2D694C
     8531CDEECBE84F33670000000000000000000000004254430000000000E4FE68
     7C90257D3D2D694C8531CDEECBE84F3367310A20B3C85F482532A9578DBB3950
     B85CA06594D100000000000000000000000042544300000000000A20B3C85F48
     2532A9578DBB3950B85CA06594D1300000000000000000000000005553440000
     0000000A20B3C85F482532A9578DBB3950B85CA06594D1FF31585E1F3BD02A15
     D6185F8BB9B57CC60DEDDB37C100000000000000000000000042544300000000
     00585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C131E4FE687C90257D3D2D69
     4C8531CDEECBE84F33670000000000000000000000004254430000000000E4FE
     687C90257D3D2D694C8531CDEECBE84F33673115036E2D3F5437A83E5AC3CAEE
     34FF2C21DEB618000000000000000000000000425443000000000015036E2D3F
     5437A83E5AC3CAEE34FF2C21DEB6183000000000000000000000000055534400
     000000000A20B3C85F482532A9578DBB3950B85CA06594D1FF31585E1F3BD02A
     15D6185F8BB9B57CC60DEDDB37C1000000000000000000000000425443000000
     0000585E1F3BD02A15D6185F8BB9B57CC60DEDDB37C13157180C769B66D942EE
     69E6DCC940CA48D82337AD000000000000000000000000425443000000000057
     180C769B66D942EE69E6DCC940CA48D82337AD10000000000000000000000000
     58525000000000003000000000000000000000000055534400000000000A20B3
     C85F482532A9578DBB3950B85CA06594D100`);

  const expectedJSON =
    [[{account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       currency: 'BTC',
       issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       type: 49},
      {account: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
       currency: 'BTC',
       issuer: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
       type: 49},
      {account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
       currency: 'BTC',
       issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
       type: 49},
      {currency: 'USD',
       issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
       type: 48}],
     [{account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       currency: 'BTC',
       issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       type: 49},
      {account: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
       currency: 'BTC',
       issuer: 'rM1oqKtfh1zgjdAgbFmaRm3btfGBX25xVo',
       type: 49},
      {account: 'rpvfJ4mR6QQAeogpXEKnuyGBx8mYCSnYZi',
       currency: 'BTC',
       issuer: 'rpvfJ4mR6QQAeogpXEKnuyGBx8mYCSnYZi',
       type: 49},
      {currency: 'USD',
       issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
       type: 48}],
     [{account: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       currency: 'BTC',
       issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
       type: 49},
      {account: 'r3AWbdp2jQLXLywJypdoNwVSvr81xs3uhn',
       currency: 'BTC',
       issuer: 'r3AWbdp2jQLXLywJypdoNwVSvr81xs3uhn',
       type: 49},
      {currency: '0000000000000000000000005852500000000000', type: 16},
      {currency: 'USD',
       issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
       type: 48}]];

  it('works with long paths', () => {
    const parser = makeParser(bytes);
    const txn = readJSON(parser);
    assert.deepEqual(txn.Paths, expectedJSON);
  });
}

function parseLedger4320278() {
  const json = loadFixture('as-ledger-4320278.json');
  json.forEach((e) => {
    it(`can parse object ${e.index}`, () => {
      const actual = readJSON(makeParser(e.binary));
      const expected = e.json;
      actual.index = expected.index;
      assert.deepEqual(actual, expected);
    });
  });
}

function dataDrivenTests() {
  unused('as-ledger-4320278.json', parseLedger4320278);
  describe('Amount parsing tests', amountParsingTests);
  describe('Field Tests', fieldParsingTests);
  describe('Parsing nested objects', nestedObjectTests);
}

describe('BinaryParser', function() {
  describe('pathSetBinaryTests', pathSetBinaryTests);
  describe('Basic API', basicApiTests);
  describe('Parsing a transction', transactionParsingTests);
  describe('Data Driven Tests', dataDrivenTests);
});
