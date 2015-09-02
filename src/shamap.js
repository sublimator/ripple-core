'use strict';

const assert = require('assert');
const makeClass = require('./make-class');
const {BytesSink} = require('./binary-serializer');
const {Hash256} = require('./types');
// TODO: this is really slow ?
const {sha512} = require('hash.js');

const PREFIXES = {
  AS_LEAF: [0x4D, 0x4C, 0x4E, 0x00],
  TX_LEAF: [0x53, 0x4E, 0x44, 0x00],
  INNER: [0x4D, 0x49, 0x4E, 0x00]
};

const Hasher = makeClass({
  implements: BytesSink,
  Hasher() {
    this.hash = sha512();
  },
  static: {
    put(bytes) {
      return new this().put(bytes);
    }
  },
  put(bytes) {
    this.hash.update(bytes);
    return this;
  },
  finish() {
    return new Hash256(this.hash.digest().slice(0, 32));
  }
});

const ShaMapNode = makeClass({
  ShaMapNode() {
    this._hash = null;
  },
  virtuals: {
    hashPrefix() {},
    isLeaf() {},
    isInner() {}
  },
  hash() {
    if (this._hash === null) {
      const hasher = Hasher.put(this.hashPrefix());
      this.toBytesSink(hasher);
      this._hash = hasher.finish();
    }
    return this._hash;
  }
});

const ShaMapLeaf = makeClass({
  extends: ShaMapNode,
  ShaMapLeaf(index, item) {
    ShaMapNode.call(this);
    this.index = index;
    this.item = item;
  },
  isLeaf() {
    return true;
  },
  isInner() {
    return false;
  },
  hashPrefix() {
    return this.item.hashPrefix();
  },
  toBytesSink(sink) {
    this.item.toBytesSink(sink);
    this.index.toBytesSink(sink);
  }
});

const $uper = ShaMapNode.prototype;

const ShaMapInner = makeClass({
  extends: ShaMapNode,
  ShaMapInner(depth = 0) {
    ShaMapNode.call(this);
    this.depth = depth;
    this.slotBits = 0;
    this.branches = Array(16);
  },
  isInner() {
    return true;
  },
  isLeaf() {
    return false;
  },
  hashPrefix() {
    return PREFIXES.INNER;
  },

  setBranch(slot, branch) {
    this.slotBits = this.slotBits | (1 << slot);
    this.branches[slot] = branch;
  },
  empty() {
    return this.slotBits === 0;
  },

  hash() {
    if (this.empty()) {
      return Hash256.ZERO_256;
    }
    return $uper.hash.call(this);
  },
  toBytesSink(sink) {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i];
      const hash = branch ? branch.hash() : Hash256.ZERO_256;
      hash.toBytesSink(sink);
    }
  },

  addItem(index, item, leaf) {
    assert(index instanceof Hash256);
    const nibble = index.nibblet(this.depth);
    const existing = this.branches[nibble];
    if (!existing) {
      this.setBranch(nibble, leaf || new ShaMapLeaf(index, item));
    } else if (existing.isLeaf()) {
      const newInner = new ShaMapInner(this.depth + 1);
      newInner.addItem(existing.index, null, existing);
      newInner.addItem(index, item, leaf);
      this.setBranch(nibble, newInner);
    } else if (existing.isInner()) {
      existing.addItem(index, item, leaf);
    } else {
      assert(false);
    }
  }
});

const ShaMap = makeClass({
  extends: ShaMapInner,
  static: {
    PREFIXES
  }
});

module.exports = {
  ShaMap
};
