/**
 * Provides contextual `scope()` and `test()` functions for creating collections
 * of test cases and dispatches an event whenever a new test scope or new test
 * case is defined.
 *
 * @module criteria
 */

/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  './lib/runner'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (runner) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /* jshint -W040 */
  this.scope = runner.scope;
  this.test = runner.test;
  /* jshint +W040 */
});
