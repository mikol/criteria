(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies =
    ['defer-each', 'instance', 'is', './must', 'promise', './runnable', 'type'];

function factory(deferEach, instance, is, must, Promise, Runnable, type) {
  /**
   * @constructor
   * @private
   */
  function Test(scope, description, fn, timeout) {
    Test.supertype.call(this, scope, description, fn, timeout);
    instance.props(this, {
      _before: [],
      _after: []
    });
  }

  type(Test).$extends(Runnable).$implements({
    before: function () {
      Test.superprototype.before.call(this);

      var context = this.context;
      var _before = this._before;
      return deferEach(this.scope.tests._before, function (runnable) {
        runnable = runnable.clone().setContext(context);
        _before.push(runnable);
        return runnable.run();
      });
    },

    after: function () {
      Test.superprototype.after.call(this);

      var context = this.context;
      var _after = this._after;
      return deferEach(this.scope.tests._after, function (runnable) {
        runnable = runnable.clone().setContext(context);
        _after.push(runnable);
        return runnable.run();
      });
    },

    main: function () {
      var context = this.context;
      var fn = this.fn;

      if (fn.length === 1) {
        return fn.call(context, instance.create(null, {
          'true': must.true.bind(context),
          'throw': must.throw.bind(context),
          resolve: must.resolve.bind(context),
          reject: must.reject.bind(context)
        }));
      } else {
        return fn.call(context);
      }
    },

    toObject: function () {
      var object = Test.superprototype.toObject.call(this);

      object._before = [];
      object._after = [];

      var _before = this._before;
      var _after = this._after;

      for (var x = 0, nx = _before.length; x < nx; ++x) {
        object._before[x] = _before[x].toObject();
      }

      for (x = 0, nx = _after.length; x < nx; ++x) {
        object._after[x] = _after[x].toObject();
      }
      return object;
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
