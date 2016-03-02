/**
 * Provides TDD-style contextual `suite()` and `test()` functions for creating
 * collections of test cases and dispatches an event whenever a new test
 * scope or new test case is defined.
 *
 * @module criteria/interfaces/tdd
 */

/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  '../runner'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (runner) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /* jshint -W040 */
  this.suiteSetup = runner.scope.before;
  this.suite = runner.scope;
  this.suite.only = runner.scope.solo;
  this.suiteTeardown = runner.scope.after;
  this.setup = runner.test.before;
  this.test.only = runner.test.solo;
  this.teardown = runner.test.after;
  /* jshint +W040 */
});
