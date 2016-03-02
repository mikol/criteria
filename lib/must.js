/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  'instance',
  'noop'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (instance, noop) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /**
   * A regular expression that extracts a function’s return statement.
   *
   * @type {RegExp}
   * @private
   */
  var RETURN_RE = /^\s*(?:function\s*[^(]*\([^(]*\)\s*\{|\(?[^(]+\)?\s*=>\s*\{?)(?:\s*.*return)?\s+([^\{;\}]+)\s*[;\}]?/;

  return instance.create(null, {
    true: function mustTrue(fn, argv, message) {
      // Remove line breaks and comments from `fn`’s source code.
      var match = RETURN_RE.exec(fn);
      var infix = '`' + (match ? match[1] : fn) + '`';

      try {
        /* jshint -W040 */
        if (fn.call(this, argv)) {
          return;
        }
        /* jshint +W040 */
      } catch (error) {
        message = message + ' ' + (error.stack || error);
      }

      message = message ? ' ' + message : '';
      throw new Error('Assertion ' + infix + ' failed.' + message);
    },

    throw: function mustThrow(fn, argv, message) {
      // Remove line breaks and comments from `fn`’s source code.
      var match = RETURN_RE.exec(fn);
      var infix = '`' + (match ? match[1] : fn) + '`';

      try {
        /* jshint -W040 */
        fn.call(this, argv);
        /* jshint +W040 */
      } catch (e) {
        return;
      }

      message = message ? ' ' + message : '';
      throw new Error('Assertion ' + infix + ' did not throw.' + message);
    },

    resolve: function mustResolve(promise, fn, argv, message) {
      if (!fn) {
        fn = noop;
      }

      message = message ? ' ' + message : '';

      return promise.then(function (value) {
        try {
          fn.call(this, value);
        } catch (e) {
          // Remove line breaks and comments from `fn`’s source code.
          var match = RETURN_RE.exec(fn);
          var infix = '`' + (match ? match[1] : fn) + '`';

          throw new Error('Assertion ' + infix + ' failed.' + message);
        }
      }, function (reason) {
        throw new Error('Assertion failed `' + promise +
            '` was not resolved. ' + reason + message);
      });
    },

    reject: function mustReject(promise, fn, argv, message) {
      if (!fn) {
        fn = noop;
      }

      message = message ? ' ' + message : '';

      return promise.then(function () {
        throw new Error(
            'Assertion failed: `promise` was not rejected.' + message);
      }, function (reason) {
        try {
          fn.call(this, reason);
        } catch (e) {
          // Remove line breaks and comments from `fn`’s source code.
          var match = RETURN_RE.exec(fn);
          var infix = '`' + (match ? match[1] : fn) + '`';

          throw new Error('Assertion ' + infix + ' failed.' + message);
        }
      });
    }
  });
});
