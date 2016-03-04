(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies =
    ['instance', 'is', './must', 'promise', './runnable', 'type'];

function factory(instance, is, must, Promise, Runnable, type) {
/* jshint ignore:end   *//* jscs:enable  */
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

    if (is.nil(fn)) {
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

  return Test;
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
