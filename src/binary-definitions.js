'use strict';

const _ = require('lodash');
const assert = require('assert');
const {bytesToHex, parseBytes} = require('./bytes-utils');

const TYPES = {
  UInt16: 1,
  UInt32: 2,
  UInt64: 3,
  Hash128: 4,
  Hash256: 5,
  Amount: 6,
  Blob: 7,
  AccountID: 8,
  STObject: 14,
  STArray: 15,
  UInt8: 16,
  Hash160: 17,
  PathSet: 18,
  Vector256: 19
};

const FIELDS = [
 ['LedgerEntryType', {'bytes': '11', 'nth': 1, 'type': 'UInt16'}],
 ['TransactionType', {'bytes': '12', 'nth': 2, 'type': 'UInt16'}],

 ['Flags', {'bytes': '22', 'nth': 2, 'type': 'UInt32'}],
 ['SourceTag', {'bytes': '23', 'nth': 3, 'type': 'UInt32'}],
 ['Sequence', {'bytes': '24', 'nth': 4, 'type': 'UInt32'}],
 ['PreviousTxnLgrSeq', {'bytes': '25', 'nth': 5, 'type': 'UInt32'}],
 ['LedgerSequence', {'bytes': '26', 'nth': 6, 'type': 'UInt32'}],
 ['CloseTime', {'bytes': '27', 'nth': 7, 'type': 'UInt32'}],
 ['ParentCloseTime', {'bytes': '28', 'nth': 8, 'type': 'UInt32'}],
 ['SigningTime', {'bytes': '29', 'nth': 9, 'type': 'UInt32'}],
 ['Expiration', {'bytes': '2A', 'nth': 10, 'type': 'UInt32'}],
 ['TransferRate', {'bytes': '2B', 'nth': 11, 'type': 'UInt32'}],
 ['WalletSize', {'bytes': '2C', 'nth': 12, 'type': 'UInt32'}],
 ['OwnerCount', {'bytes': '2D', 'nth': 13, 'type': 'UInt32'}],
 ['DestinationTag', {'bytes': '2E', 'nth': 14, 'type': 'UInt32'}],
 ['HighQualityIn', {'bytes': '2010', 'nth': 16, 'type': 'UInt32'}],
 ['HighQualityOut', {'bytes': '2011', 'nth': 17, 'type': 'UInt32'}],
 ['LowQualityIn', {'bytes': '2012', 'nth': 18, 'type': 'UInt32'}],
 ['LowQualityOut', {'bytes': '2013', 'nth': 19, 'type': 'UInt32'}],
 ['QualityIn', {'bytes': '2014', 'nth': 20, 'type': 'UInt32'}],
 ['QualityOut', {'bytes': '2015', 'nth': 21, 'type': 'UInt32'}],
 ['StampEscrow', {'bytes': '2016', 'nth': 22, 'type': 'UInt32'}],
 ['BondAmount', {'bytes': '2017', 'nth': 23, 'type': 'UInt32'}],
 ['LoadFee', {'bytes': '2018', 'nth': 24, 'type': 'UInt32'}],
 ['OfferSequence', {'bytes': '2019', 'nth': 25, 'type': 'UInt32'}],
 ['FirstLedgerSequence', {'bytes': '201A', 'nth': 26, 'type': 'UInt32'}],
 ['LastLedgerSequence', {'bytes': '201B', 'nth': 27, 'type': 'UInt32'}],
 ['TransactionIndex', {'bytes': '201C', 'nth': 28, 'type': 'UInt32'}],
 ['OperationLimit', {'bytes': '201D', 'nth': 29, 'type': 'UInt32'}],
 ['ReferenceFeeUnits', {'bytes': '201E', 'nth': 30, 'type': 'UInt32'}],
 ['ReserveBase', {'bytes': '201F', 'nth': 31, 'type': 'UInt32'}],
 ['ReserveIncrement', {'bytes': '2020', 'nth': 32, 'type': 'UInt32'}],
 ['SetFlag', {'bytes': '2021', 'nth': 33, 'type': 'UInt32'}],
 ['ClearFlag', {'bytes': '2022', 'nth': 34, 'type': 'UInt32'}],

 ['IndexNext', {'bytes': '31', 'nth': 1, 'type': 'UInt64'}],
 ['IndexPrevious', {'bytes': '32', 'nth': 2, 'type': 'UInt64'}],
 ['BookNode', {'bytes': '33', 'nth': 3, 'type': 'UInt64'}],
 ['OwnerNode', {'bytes': '34', 'nth': 4, 'type': 'UInt64'}],
 ['BaseFee', {'bytes': '35', 'nth': 5, 'type': 'UInt64'}],
 ['ExchangeRate', {'bytes': '36', 'nth': 6, 'type': 'UInt64'}],
 ['LowNode', {'bytes': '37', 'nth': 7, 'type': 'UInt64'}],
 ['HighNode', {'bytes': '38', 'nth': 8, 'type': 'UInt64'}],

 ['EmailHash', {'bytes': '41', 'nth': 1, 'type': 'Hash128'}],

 ['LedgerHash', {'bytes': '51', 'nth': 1, 'type': 'Hash256'}],
 ['ParentHash', {'bytes': '52', 'nth': 2, 'type': 'Hash256'}],
 ['TransactionHash', {'bytes': '53', 'nth': 3, 'type': 'Hash256'}],
 ['AccountHash', {'bytes': '54', 'nth': 4, 'type': 'Hash256'}],
 ['PreviousTxnID', {'bytes': '55', 'nth': 5, 'type': 'Hash256'}],
 ['LedgerIndex', {'bytes': '56', 'nth': 6, 'type': 'Hash256'}],
 ['WalletLocator', {'bytes': '57', 'nth': 7, 'type': 'Hash256'}],
 ['RootIndex', {'bytes': '58', 'nth': 8, 'type': 'Hash256'}],
 ['AccountTxnID', {'bytes': '59', 'nth': 9, 'type': 'Hash256'}],
 ['BookDirectory', {'bytes': '5010', 'nth': 16, 'type': 'Hash256'}],
 ['InvoiceID', {'bytes': '5011', 'nth': 17, 'type': 'Hash256'}],
 ['Nickname', {'bytes': '5012', 'nth': 18, 'type': 'Hash256'}],
 ['Amendment', {'bytes': '5013', 'nth': 19, 'type': 'Hash256'}],
 ['TicketID', {'bytes': '5014', 'nth': 20, 'type': 'Hash256'}],

 ['Amount', {'bytes': '61', 'nth': 1, 'type': 'Amount'}],
 ['Balance', {'bytes': '62', 'nth': 2, 'type': 'Amount'}],
 ['LimitAmount', {'bytes': '63', 'nth': 3, 'type': 'Amount'}],
 ['TakerPays', {'bytes': '64', 'nth': 4, 'type': 'Amount'}],
 ['TakerGets', {'bytes': '65', 'nth': 5, 'type': 'Amount'}],
 ['LowLimit', {'bytes': '66', 'nth': 6, 'type': 'Amount'}],
 ['HighLimit', {'bytes': '67', 'nth': 7, 'type': 'Amount'}],
 ['Fee', {'bytes': '68', 'nth': 8, 'type': 'Amount'}],
 ['SendMax', {'bytes': '69', 'nth': 9, 'type': 'Amount'}],
 ['MinimumOffer', {'bytes': '6010', 'nth': 16, 'type': 'Amount'}],
 ['RippleEscrow', {'bytes': '6011', 'nth': 17, 'type': 'Amount'}],
 ['DeliveredAmount', {'bytes': '6012', 'nth': 18, 'type': 'Amount'}],

 ['PublicKey', {'bytes': '71', 'nth': 1, 'type': 'Blob'}],
 ['MessageKey', {'bytes': '72', 'nth': 2, 'type': 'Blob'}],
 ['SigningPubKey', {'bytes': '73', 'nth': 3, 'type': 'Blob'}],
 ['TxnSignature', {'bytes': '74', 'nth': 4, 'type': 'Blob'}],
 ['Generator', {'bytes': '75', 'nth': 5, 'type': 'Blob'}],
 ['Signature', {'bytes': '76', 'nth': 6, 'type': 'Blob'}],
 ['Domain', {'bytes': '77', 'nth': 7, 'type': 'Blob'}],
 ['FundCode', {'bytes': '78', 'nth': 8, 'type': 'Blob'}],
 ['RemoveCode', {'bytes': '79', 'nth': 9, 'type': 'Blob'}],
 ['ExpireCode', {'bytes': '7A', 'nth': 10, 'type': 'Blob'}],
 ['CreateCode', {'bytes': '7B', 'nth': 11, 'type': 'Blob'}],
 ['MemoType', {'bytes': '7C', 'nth': 12, 'type': 'Blob'}],
 ['MemoData', {'bytes': '7D', 'nth': 13, 'type': 'Blob'}],
 ['MemoFormat', {'bytes': '7E', 'nth': 14, 'type': 'Blob'}],

 ['Account', {'bytes': '81', 'nth': 1, 'type': 'AccountID'}],
 ['Owner', {'bytes': '82', 'nth': 2, 'type': 'AccountID'}],
 ['Destination', {'bytes': '83', 'nth': 3, 'type': 'AccountID'}],
 ['Issuer', {'bytes': '84', 'nth': 4, 'type': 'AccountID'}],
 ['Target', {'bytes': '87', 'nth': 7, 'type': 'AccountID'}],
 ['RegularKey', {'bytes': '88', 'nth': 8, 'type': 'AccountID'}],

 ['ObjectEndMarker', {'bytes': 'E1', 'nth': 1, 'type': 'STObject'}],
 ['TransactionMetaData', {'bytes': 'E2', 'nth': 2, 'type': 'STObject'}],
 ['CreatedNode', {'bytes': 'E3', 'nth': 3, 'type': 'STObject'}],
 ['DeletedNode', {'bytes': 'E4', 'nth': 4, 'type': 'STObject'}],
 ['ModifiedNode', {'bytes': 'E5', 'nth': 5, 'type': 'STObject'}],
 ['PreviousFields', {'bytes': 'E6', 'nth': 6, 'type': 'STObject'}],
 ['FinalFields', {'bytes': 'E7', 'nth': 7, 'type': 'STObject'}],
 ['NewFields', {'bytes': 'E8', 'nth': 8, 'type': 'STObject'}],
 ['TemplateEntry', {'bytes': 'E9', 'nth': 9, 'type': 'STObject'}],
 ['Memo', {'bytes': 'EA', 'nth': 10, 'type': 'STObject'}],

 ['ArrayEndMarker', {'bytes': 'F1', 'nth': 1, 'type': 'STArray'}],
 ['SigningAccounts', {'bytes': 'F2', 'nth': 2, 'type': 'STArray'}],
 ['TxnSignatures', {'bytes': 'F3', 'nth': 3, 'type': 'STArray'}],
 ['Signatures', {'bytes': 'F4', 'nth': 4, 'type': 'STArray'}],
 ['Template', {'bytes': 'F5', 'nth': 5, 'type': 'STArray'}],
 ['Necessary', {'bytes': 'F6', 'nth': 6, 'type': 'STArray'}],
 ['Sufficient', {'bytes': 'F7', 'nth': 7, 'type': 'STArray'}],
 ['AffectedNodes', {'bytes': 'F8', 'nth': 8, 'type': 'STArray'}],
 ['Memos', {'bytes': 'F9', 'nth': 9, 'type': 'STArray'}],

 ['CloseResolution', {'bytes': '0110', 'nth': 1, 'type': 'UInt8'}],
 ['TemplateEntryType', {'bytes': '0210', 'nth': 2, 'type': 'UInt8'}],
 ['TransactionResult', {'bytes': '0310', 'nth': 3, 'type': 'UInt8'}],

 ['TakerPaysCurrency', {'bytes': '0111', 'nth': 1, 'type': 'Hash160'}],
 ['TakerPaysIssuer', {'bytes': '0211', 'nth': 2, 'type': 'Hash160'}],
 ['TakerGetsCurrency', {'bytes': '0311', 'nth': 3, 'type': 'Hash160'}],
 ['TakerGetsIssuer', {'bytes': '0411', 'nth': 4, 'type': 'Hash160'}],

 ['Paths', {'bytes': '0112', 'nth': 1, 'type': 'PathSet'}],
 ['Indexes', {'bytes': '0113', 'nth': 1, 'type': 'Vector256'}],
 ['Hashes', {'bytes': '0213', 'nth': 2, 'type': 'Vector256'}],
 ['Features', {'bytes': '0313', 'nth': 3, 'type': 'Vector256'}]
];

function fieldHeader(type, nth) {
  const name = nth;
  const header = [];
  const add = header.push.bind(header);
  if (type < 16) {
    if (name < 16) {
      add((type << 4) | name);
    } else {
      add((type << 4), name);
    }
  } else if (name < 16) {
    add(name, type);
  } else {
    add(0, type, name);
  }
  return parseBytes(header, Uint8Array);
}

class Type {
  constructor({name, ordinal}) {
    this.name = name;
    this.ordinal = ordinal;
  }
  toString() {
    return this.name;
  }
}

class Field {
  constructor({name, type, nth}) {
    this.name = name;
    this.type = type;
    this.nth = nth;
    this.ordinal = (type.ordinal << 16) | nth;
    this.bytes = fieldHeader(type.ordinal, nth);
    this.isVLEncoded = _.includes(['Blob', 'AccountID', 'Vector256'],
                                   this.type.name);
  }
  toString() {
    return this.name;
  }
}

const types = _.transform(TYPES, (result, ordinal, name) => {
  const type = new Type({name, ordinal});
  result[name] = type;
  if (!result.byOrdinal) {
    const n = Math.max.apply(null, _.values(TYPES));
    result.byOrdinal = _.fill(Array(n + 1), undefined);
  }
  result.byOrdinal[type.ordinal] = type;
});

const fields = _.indexBy(_.map(FIELDS, ([name, definition]) => {
  const type = types[definition.type];
  if (definition.bytes) {
    const header = fieldHeader(type.ordinal, definition.nth);
    assert.equal(bytesToHex(header), definition.bytes);
  }
  return new Field(_.assign(definition, {name, type}));
}), 'name');

fields.byOrdinal = _.transform(fields, (result, field) => {
  result[field.ordinal] = field;
});

module.exports = {
  Type,
  Field,
  fields,
  types
};
