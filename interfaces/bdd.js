/**
 * Provides BDD-style contextual `describe()` and `it()` functions for creating
 * collections of test cases and dispatches an event whenever a new test scope
 * or new test case is defined.
 *
 * @module criteria/interfaces/bdd
 */

/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  '../runner'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (runner) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /* jshint -W040 */
  this.before = runner.scope.before;
  this.describe = runner.scope;
  this.describe.only = runner.scope.solo;
  this.xdescribe = runner.scope.skip;
  this.after = runner.scope.after;
  this.beforeEach = runner.test.before;
  this.it = runner.test;
  this.it.only = runner.test.solo;
  this.xit = runner.test.skip;
  this.afterEach = runner.test.after;
  /* jshint +W040 */
});
