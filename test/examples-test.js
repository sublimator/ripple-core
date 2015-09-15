'use strict';

const assert = require('assert');
const {
  unused,
  captureLogs,
  captureLogsAsync,
  writeFixture,
  loadFixtureText
} = require('./utils');

unused(writeFixture);

describe('Examples', function() {
  describe('sign-transaction-for.js', function() {
    it('a', function() {
      const main = require('../examples/sign-transaction-for');
      const secret = 'dan';
      const tx_json =
        {
          Account: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
          Fee: '100',
          Flags: 0,
          LastLedgerSequence: 7,
          Sequence: 3,
          Signers: [
            {
              Signer: {
                Account: 'rH4KEcG9dEwGwpn6AyoWK9cZPLL4RLSmWW',
                SigningPubKey:
                  '028949021029D5CC87E78BCF053AFEC0C' +
                  'AFD15108EC119EAAFEC466F5C095407BF',
                TxnSignature:
                  '3045022100EB4C6F7EB14B24118DB314B6D5' +
                  '4EACDC30F80855A799FA521CB7CE3E8D12ED' +
                  'BC0220648F8BED8B0662C057586D7C4FA843' +
                  '964014B3FA370EE8AF02BE8A99D7232C7E'
              }
            },
            {
              Signer: {
                Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
                SigningPubKey:
                  '02691AC5AE1C4C333AE5DF8A93BDC495F' +
                  '0EEBFC6DB0DA7EB6EF808F3AFC006E3FE',
                TxnSignature:
                  '304402200633DB273753C2F913D91F2946F4' +
                  '4D62CC7582DC3BB25872BC19298920DF6FD3' +
                  '02204204CA08F51A7B0513C38C05F8A8CE42' +
                  'ABA9CFA8999B4D1719AE2C754BA07DB4'
              }
            }
          ],
          SigningPubKey: '',
          TransactionType: 'AccountSet'
        };
      const args = [
        '.',
        'examples/sign-transaction-for.js',
        secret,
        JSON.stringify(tx_json)
      ];
      const log = captureLogs(() => main(args));
      const fn = 'examples/sign-transaction-for/a.txt';
      // writeFixture(fn, log);
      assert.equal(log, loadFixtureText(fn));
    });
  });
  describe('sign-transaction.js', function() {
    it('a', function() {
      const main = require('../examples/sign-transaction');
      const secret = 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6';
      const tx_json = {
        'Account': 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
        'Amount': '1000',
        'Destination': 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        'Fee': '10',
        'Flags': 2147483648,
        'Sequence': 1,
        'TransactionType': 'Payment'
      };
      const args = [
        '.',
        'examples/sign-transaction.js',
        secret,
        JSON.stringify(tx_json)
      ];
      const log = captureLogs(() => main(args));
      const fn = 'examples/sign-transaction/a.txt';
      // writeFixture(fn, log);
      assert.equal(log, loadFixtureText(fn));
    });
  });
  describe('transaction.db.js', function() {
    it('a', function(done) {
      const fn = 'examples/transaction.db/a.txt';
      const main = require('../examples/transaction.db');
      // main takes an option as parsed by yargs
      const getLogs = captureLogsAsync();
      main({
        recycle_test: true,
        db: __dirname + '/fixtures/account-tx-transactions.db',
        done() {
          const log = getLogs();
          assert.equal(log, loadFixtureText(fn));
          done();
        }
      });
    });
  });
});
