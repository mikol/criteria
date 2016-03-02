/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  'instance',
  'is',
  './must',
  'promise',
  './runnable',
  'type'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (instance, is, must, Promise, Runnable, type) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /**
   * @const {undefined}
   * @private
   */
  var U;

  /**
   * @constructor
   * @private
   */
  function Test(scope, description, fn, timeout) {
    Test.supertype.call(this, scope, description, fn, timeout);

    if (!fn) {
      this.skip();
    }
  }

  type(Test)['extends'](Runnable)['implements']({
    before: function (context) {
      Test.superprototype.before.call(this);

      var promised = false;
      var promises = this.scope.tests._before.map(function (runnable) {
        var returned = runnable.clone().run(context);

        if (is.thenable(returned)) {
          promised = true;
        }

        return returned;
      });

      if (promised) {
        return Pr.all(promises);
      }
    },

    after: function (reason, value, context) {
      Test.superprototype.after.call(this, reason, value);

      var promised = false;
      var promises = this.scope.tests._after.map(function (runnable) {
        var returned = runnable.clone().run(context);

        if (is.thenable(returned)) {
          promised = true;
        }

        return returned;
      });

      // FIXME: How to surface failures during teardown?
      if (promised) {
        return Pr.all(promises);
      }
    },

    continue: function (context) {
      instance.props(this, {
        time: Date.now()
      });

      var fn = this.fn;
      var returned;

      try {
        if (fn.length === 1) {
          returned = fn.call(context, instance.props({}, {
            true: must.true.bind(context),
            throw: must.throw.bind(context),
            resolve: must.resolve.bind(context),
            reject: must.reject.bind(context)
          }));
        } else {
          returned = fn.call(context);
        }
      } catch (e) {
        this.reject(e);
        return returned;
      }

      return this.harness(returned, context);
    },

    harness: function (returned, context) {
      returned = Test.superprototype.harness.call(this, returned);

      if (!is.thenable(returned)) {
        this.after(U, returned, context);
      }

      return returned;
    },

    run: function (context) {
      if (this.skipped) {
        this.resolve();

        instance.props(this, {
          duration: Date.now() - (this.time || Date.now()),
        });

        return;
      }

      var self = this;

      this.promise.then(function (value) {
        self.after(U, value, context);
      }, function (reason) {
        self.after(reason, U, context);
      }); // FIXME: Add `catch` for `Test.prototype.after()` throws?

      var returned = this.before(context);

      if (is.thenable(returned)) {
        returned.then(function () {
          self.continue(context);
        }).then(function (value) {
          self.resolve(value);
        }).ctach(function (reason) {
          self.reject(reason);
        });

        return this.promise;
      } else {
        return this.continue(context);
      }
    },

    toObject: function () {
      return {
        description: this.description,
        duration: this.duration,
        failed: this.failed,
        output: this.output,
        skipped: this.skipped,
        time: this.time
      };
    }
  });

  return Test;
});
