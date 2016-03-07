(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['instance', 'is', 'observable', 'promise', 'type'];

function factory(instance, is, Observable, Promise, type) {
  var DEFAULT_TIMEOUT_MS = 5000;
  var TIMED_OUT = 'Operation timed out.';

  /**
   * @constructor
   * @private
   */
  function Runnable(scope, description, fn, timeout) {
    Runnable.supertype.call(this);

    var resolve;
    var reject;
    var promise = new Promise(function (_resolve, _reject) {
      resolve = function resolve(value) {
        _resolve(value);
        /* jshint -W040 */
        this.stamp(null, value);
        /* jshint +W040 */
      };

      reject = function reject(reason) {
        _reject(reason);
        /* jshint -W040 */
        this.stamp(reason);
        /* jshint +W040 */
      };
    });

    instance.props(this, {
      context: {value: {}, writable: true},
      description: description,
      fn: fn,
      promise: promise,
      scope: scope,
      reject: reject,
      resolve: resolve,
      timeout: timeout || DEFAULT_TIMEOUT_MS
    });

    if (is.nil(fn)) {
      this.skip();
    }
  }

  type(Runnable).$extends(Observable).$implements({
    before: function () {
      return Promise.resolve();
    },

    after: function () {
      clearTimeout(this.timer);
      return Promise.resolve();
    },

    clone: function () {
      var scope = this.scope;
      var description = this.description;
      var fn = this.fn;
      var timeout = this.timeout === DEFAULT_TIMEOUT_MS ? null : this.timeout;

      return new this.constructor(scope, description, fn, timeout);
    },

    main: function () {
      return this.fn.call(this.context);
    },

    run: function () {
      instance.props(this, {
        time: Date.now()
      });

      if (this.skipped) {
        this.resolve();
        return this.promise;
      }

      var self = this;

      return this.before().then(function () {
        return new Promise(function (resolve, reject) {
          try {
            var returned = self.main();

            if (is.thenable(returned)) {
              returned.then(function (value) {
                resolve(value);
              }, function (reason) {
                reject(reason);
              });

              var timeoutErrorStack = new Error(TIMED_OUT).stack;
              self.timer = setTimeout(function () {
                reject(timeoutErrorStack);
              }, self.timeout);
            } else {
              resolve(returned);
            }
          } catch (e) {
            reject(e);
          }
        });
      }).then(function () {
        return self.after();
      }, function (reason) {
        self.after();
        throw reason;
      }).then(function (value) {
        self.resolve(value);
      }, function (reason) {
        self.reject(reason);
      });
    },

    setContext: function (context) {
      this.context = context;
      return this;
    },

    skip: function () {
      this.skipped = true;
      return this;
    },

    solo: function () {
      this.soloed = true;
      return this;
    },

    /** @private */
    stamp: function (reason, value) {
      if (is.nil(this.duration)) {
        instance.props(this, {
          duration: Date.now() - (this.time || Date.now()),
          failed: !!reason,
          output: is.def(reason) ? reason : value
        });
      } else {
        console.log('Warning: `' + this.description + '` is already stamped.');
      }
    },

    toObject: function () {
      var output = this.output;
      if (is.error(output)) {
        output = {
          message: output.message || null,
          name: output.name || null,
          stack: output.stack || null
        };
      }

      return {
        description: this.description,
        duration: this.duration,
        failed: this.failed,
        output: output,
        skipped: this.skipped,
        time: this.time
      };
    }
  });

  return Runnable;
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
