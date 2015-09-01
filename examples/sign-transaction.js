#!/usr/bin/env babel-node

/* eslint-disable func-style */
'use strict';

const yargs = require('yargs');
const {STObject, binary} = require('../src');
const {serializeObject, bytesToHex, sha512Half} = binary;
const keyPairFromSeed = require('ripple-keypairs').keyPairFromSeed;

const PREFIXES = {signing: [0x53, 0x54, 0x58, 0x00],
                       id: [0x54, 0x58, 0x4E, 0x00]};

const prettyJSON = obj => JSON.stringify(obj, undefined, 2);
const signingData = tx => serializeObject(tx, PREFIXES.signing);

function signTxJson(seed, tx_json) {
  const keyPair = keyPairFromSeed(seed);
  const tx = STObject.from(tx_json);
  const pubKey = keyPair.pubKeyHex();

  tx.SigningPubKey = pubKey;
  tx.TxnSignature = keyPair.signHex(signingData(tx));

  const serialized = serializeObject(tx);
  const hash = bytesToHex(sha512Half(PREFIXES.id, serialized));
  const tx_blob = bytesToHex(serialized);

  return {
    unsigned: tx_json,
    signed: tx,
    tx_blob,
    hash
  };
}

const example = {
  seed: 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6',
  tx_json: JSON.stringify({
    Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
    Amount: '1000',
    Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    Fee: '10',
    Flags: 2147483648,
    Sequence: 1,
    TransactionType: 'Payment'
  })
};

(function main() {
  const {argv: {_: [seedPos, txPos]}} = yargs;
  const params = {
    seed: seedPos || example.seed,
    tx_json: JSON.parse(txPos || example.tx_json)
  };
  const bundle = signTxJson(params.seed, params.tx_json);
  console.log(prettyJSON(bundle));
}());
