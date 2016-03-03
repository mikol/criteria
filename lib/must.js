(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['instance', 'noop'];

function factory(instance, noop) {
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
    'true': function mustTrue(fn, argv, message) {
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

    'throw': function mustThrow(fn, argv, message) {
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
