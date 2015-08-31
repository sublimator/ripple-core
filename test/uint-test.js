'use strict';

const assert = require('assert');
const coreTypes = require('../src');
/* eslint-disable no-unused-vars */
const {UInt8, UInt16, UInt32, UInt64} = coreTypes;
/* eslint-enable no-unused-vars */

function compareToTests() {

  function check(expr, is) {
    it(expr, function() {
      /* eslint-disable no-eval */
      assert.equal(eval(expr), is);
      /* eslint-enable no-eval */
    });
  }
  check('UInt8.from(124).compareTo(UInt64.from(124))', 0);
  check('UInt64.from(124).compareTo(UInt8.from(124))', 0);
  check('UInt64.from(124).compareTo(UInt8.from(123))', 1);
  check('UInt8.from(124).compareTo(UInt8.from(13))', 1);
}

describe('Uint*', function() {
  describe('compareToTests', compareToTests);
});

