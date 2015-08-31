'use strict';


const _ = require('lodash');
const assert = require('assert');
const coreTypes = require('../src/types');

describe('SerializedType interfaces', function() {
  _.forOwn(coreTypes, (Value, name) => {
    it(`${name} has a \`from\` static constructor`, function() {
      assert(Value.from && Value.from !== Array.from);
    });
    it(`${name} has a default constructor`, function() {
      /* eslint-disable no-new*/
      new Value();
      /* eslint-enable no-new*/
    });
    it(`${name}.from will return the same object`, function() {
      const instance = new Value();
      assert(Value.from(instance) === instance);
    });
    it(`${name} instances have toBytesSink`, function() {
      assert(new Value().toBytesSink);
    });
    it(`${name} instances have toJSON`, function() {
      assert(new Value().toJSON);
    });
  });
});
