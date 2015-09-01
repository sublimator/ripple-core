#!/usr/bin/env babel-node

/* eslint-disable func-style */
'use strict';

const path = require('path');
const {STObject, binary} = require('../src');
const {serializeObject, bytesToHex, sha512Half} = binary;
const {keyPairFromSeed} = require('ripple-keypairs');

const PREFIXES = {SIGNING: [0x53, 0x54, 0x58, 0x00],
                       ID: [0x54, 0x58, 0x4E, 0x00]};

const EXAMPLE = {
  secret: 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6',
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

const toHex = v => bytesToHex(v);
const prettyJSON = obj => JSON.stringify(obj, undefined, 2);
const signingData = tx => serializeObject(tx, PREFIXES.SIGNING);

function signTxJson(secret, tx_json) {
  const keyPair = keyPairFromSeed(secret);
  // While we could just work directly off tx_json (try it) we create an
  // STObject, so that many of the values are parsed only once.
  const tx = STObject.from(tx_json);

  tx.SigningPubKey = toHex(keyPair.pubKeyCanonicalBytes());
  tx.TxnSignature = toHex(keyPair.sign(signingData(tx)));

  const serialized = serializeObject(tx);
  const hash = toHex(sha512Half(PREFIXES.ID, serialized));
  const tx_blob = toHex(serialized);

  return {
    unsigned: tx_json,
    signed: tx,
    tx_blob,
    hash
  };
}

(function main(args = process.argv) {
  const [, script, secret, tx_json] = args;
  if (args.length < 4) {
    const relative = path.relative(process.cwd(), script);
    console.error(`Usage: ${relative} <secret> <tx_json>\ne.g:`);
    console.error(`${relative} ${EXAMPLE.secret} '${EXAMPLE.tx_json}'`);
  } else {
    const bundle = signTxJson(secret, JSON.parse(tx_json));
    console.log(prettyJSON(bundle));
  }
}());
