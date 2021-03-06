/**
 * Provides TDD-style contextual `suite()` and `test()` functions for creating
 * collections of test cases and dispatches an event whenever a new test
 * scope or new test case is defined.
 *
 * @module criteria/interfaces/tdd
 */

(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['../lib/runner'];

function factory(runner) {
  /* jshint -W040 */
  this.suiteSetup = runner.scope.before;
  this.suite = runner.scope;
  this.suite.only = runner.scope.solo;
  this.suiteTeardown = runner.scope.after;
  this.setup = runner.test.before;
  this.test.only = runner.test.solo;
  this.teardown = runner.test.after;
  /* jshint +W040 */
}

// -----------------------------------------------------------------------------
var x = dependencies.length; var o = 'object';
context = typeof global === o ? global : typeof window === o ? window : context;
if (typeof define === 'function' && define.amd) {
  define(dependencies, function () {
    return factory.apply(context, [].slice.call(arguments));
  });
} else if (typeof module === o && module.exports) {
  for (; x--;) {dependencies[x] = require(dependencies[x]);}
  module.exports = factory.apply(context, dependencies);
} else {
  for (; x--;) {dependencies[x] = context[dependencies[x]];}
  context[id] = factory.apply(context, dependencies);
}
}(this));
