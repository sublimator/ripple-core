'use strict';
/* eslint-disable func-style */

const _ = require('lodash');
const {AccountID, Blob, STObject} = require('./types');
const binary = require('./binary');
const {serializeObject, bytesToHex, multiSigningData,
       transactionID, signingData} = binary;

const toHex = v => bytesToHex(v);
const getSigner = (o) => AccountID.from(o.Signer.Account);
const signerComparator = (a, b) => getSigner(a).compareTo(getSigner(b));

function signFor(tx_json_, keyPair, signingAccount = null) {
  const tx_json = _.assign({}, tx_json_, {SigningPubKey: ''});
  const signerID = signingAccount || keyPair.id();
  const signature = keyPair.sign(multiSigningData(tx_json, signerID));
  const signer = {
    Signer: {
      SigningPubKey: Blob.from(keyPair.publicBytes()),
      TxnSignature: Blob.from(signature),
      Account: AccountID.from(signerID)
    }
  };

  const signers = tx_json.Signers = tx_json.Signers || [];
  signers.push(signer);
  signers.sort(signerComparator);

  const serialized = serializeObject(tx_json);
  const hash = transactionID(serialized).toHex();
  const tx_blob = toHex(serialized);

  return {
    tx_json: STObject.from(tx_json).toJSON(),
    tx_blob,
    hash
  };
}

function sign(tx_json, keyPair) {
  const tx = STObject.from(tx_json);

  tx.SigningPubKey = Blob.from(keyPair.publicBytes());
  tx.TxnSignature = Blob.from(keyPair.sign(signingData(tx)));

  const serialized = serializeObject(tx);
  const hash = transactionID(serialized).toHex();
  const tx_blob = toHex(serialized);

  return {
    tx_json: tx.toJSON(),
    tx_blob,
    hash
  };
}

module.exports = {
  signFor,
  sign
};

