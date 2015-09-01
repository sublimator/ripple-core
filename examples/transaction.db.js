#!/usr/bin/env babel-node
/* eslint-disable curly */
'use strict';

const _ = require('lodash');
const Sequelize = require('sequelize');
const {binary: {readJSON, makeParser}} = require('../src');

function binaryToJSON(binary) {
  return readJSON(makeParser(binary));
}

function prettyJSON(value) {
  return JSON.stringify(value, null, 2);
}

function makeTransactionModel(sequelize) {
  const transactionsTable = {
    TransID: {type: Sequelize.STRING, primaryKey: true},
    TransType: {type: Sequelize.STRING},
    FromAcct: {type: Sequelize.STRING},
    FromSeq: {type: Sequelize.BIGINT},
    LedgerSeq: {type: Sequelize.BIGINT},
    Status: {type: Sequelize.STRING},
    RawTxn: {type: Sequelize.BLOB},
    TxnMeta: {type: Sequelize.BLOB}
  };

  const instanceMethods = {
    toJSON() {
      const tx_json = binaryToJSON(this.RawTxn);
      tx_json.hash = this.TransID;
      const meta = binaryToJSON(this.TxnMeta);
      const ledger_index = this.LedgerSeq;
      return {meta, tx_json, ledger_index};
    }
  };

  const config = {
    timestamps: false,
    freezeTableName: true,
    instanceMethods
  };

  return sequelize.define('Transactions', transactionsTable, config);
}

function initDB(dbPath) {
  const sequelize = new Sequelize(
      'transaction.db', 'user', 'pass',
      {logging: false, dialect: 'sqlite', storage: dbPath});
  const Transaction = makeTransactionModel(sequelize);
  return {Transaction};
}

function makeQuery(argv) {
  const mapping = {
    hash: 'TransID',
    ledger_index: 'LedgerSeq',
    account: 'FromAcct',
    type: 'TransType'
  };
  const where = _.transform(mapping, (to, v, k) => {
    const arg = argv[k];
    if (arg) {
      to[v] = arg;
    }
  });
  return {where, limit: argv.limit || 200};
}

(function main() {
  const argv = require('yargs')
      .describe('db', 'abs path to transaction.db')
      .describe('hash', 'hash of a transaction to dump')
      .describe('ledger_index', 'restrict query to given ledger_index')
      .describe('account', 'restrict query to given Account')
      .describe('type', 'restrict query to given TransactionType')
      .demand('db')
      .argv;
  const {Transaction} = initDB(argv.db);
  const query = makeQuery(argv);
  Transaction.findAll(query).then(function(txns) {
    console.log(prettyJSON(txns));
    // support script.js $argv > dump.json
    console.error({query});
  });
}());
