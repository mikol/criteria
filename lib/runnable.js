/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  'instance',
  'is',
  'observable',
  'promise',
  'type'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (instance, is, Observable, Promise, type) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  var DEFAULT_TIMEOUT_MS = 3000;
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
      resolve = _resolve;
      reject = _reject;
    });

    promise.description = description;

    instance.props(this, {
      description: description,
      fn: fn,
      promise: promise,
      scope: scope,
      reject: reject,
      resolve: resolve,
      timeout: timeout || DEFAULT_TIMEOUT_MS
    });
  }

  type(Runnable)['extends'](Observable)['implements']({
    before: function () {},

    after: function (reason, value) {
      if (is.nix(this.duration)) {
        instance.props(this, {
          duration: Date.now() - (this.time || Date.now()),
          failed: !!reason,
          output: reason || value
        });
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }
    },

    clone: function () {
      var scope = this.scope;
      var description = this.description;
      var fn = this.fn;
      var timeout = this.timeout === DEFAULT_TIMEOUT_MS ? null : this.timeout;

      return new this.constructor(scope, description, fn, timeout);
    },

    harness: function (returned)  {
      if (is.thenable(returned)) {
        var self = this;

        returned.then(function (value) {
          self.resolve(value);
        }, function (reason) {
          self.reject(reason);
        });

        var timeoutErrorStack = new Error(TIMED_OUT).stack;
        this.timer = setTimeout(function () {
          self.reject(timeoutErrorStack);
        }, this.timeout);

        return this.promise;
      }

      this.resolve(returned);
      return returned;
    },

    run: function (context) {
      instance.props(this, {
        time: Date.now()
      });

      try {
        return this.harness(this.fn.call(context));
      } catch (e) {
        this.reject(e);
        this.after(e);
      }
    },

    skip: function () {
      this.skipped = true;
      return this;
    },

    solo: function () {
      this.soloed = true;
      return this;
    }
  });

  return Runnable;
});
