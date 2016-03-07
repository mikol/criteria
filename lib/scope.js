(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies =
    ['defer-each', 'instance', 'is', 'promise', './runnable', 'type'];

function factory(deferEach, instance, is, Promise, Runnable, type) {
  function findRootScope(scope) {
    while (scope.constructor === Scope) {
      scope = scope.scope;
    }

    return scope;
  }

  function Scope(parent, description, fn) {
    Scope.supertype.call(this, parent, description, fn);

    if (is.nil(fn)) {
      this.skip();
    }

    instance.props(this, {
      _before: [],
      _after: [],
      scopes: [],
      tests: []
    });

    instance.props(this.tests, {
      _before: [],
      _after: []
    });

    findRootScope(parent).applyInScope(fn, this);
  }

  type(Scope).$extends(Runnable).$implements({
    before: function () {
      var context = this.context;
      var parentContext = this.scope.context;

      if (is.def(parentContext)) {
        instance.assign(context, parentContext);
      }

      Scope.superprototype.before.call(this);

      return deferEach(this._before, function (runnable) {
        return runnable.setContext(context).run();
      });
    },

    after: function () {
      Scope.superprototype.after.call(this);

      var context = this.context;
      return deferEach(this._after, function (runnable) {
        return runnable.setContext(context).run();
      });
    },

    main: function () {
      var scopes = this.scopes;
      var tests = this.tests;
      var pending = scopes.length + tests.length;

      if (pending === 0) {
        return this.resolve();
      }

      var self = this;
      var soloScopes = false;
      var soloTests = false;

      for (var x = 0, nx = scopes.length; x < nx; ++x) {
        if (scopes[x].soloed) {
          soloScopes = true;
          break;
        }
      }

      for (x = 0, nx = tests.length; x < nx; ++x) {
        if (tests[x].soloed) {
          soloTests = true;
          break;
        }
      }

      return deferEach(scopes, function (scope) {
        if (soloScopes && !scope.soloed) {
          scope.skip();
        }

        return scope.run();
      }).then(function () {
        return deferEach(tests, function (test) {
          if (self.skipped || test.skipped || (soloTests && !test.soloed)) {
            test.skip();
          }

          return test.setContext(instance.create(self.context)).run();
        });
      });
    },

    skip: function () {
      Scope.superprototype.skip.call(this);

      var scopes = this.scopes;
      for (var x = 0, nx = scopes.length; x < nx; ++x) {
        scopes[x].skip();
      }

      return this;
    },

    toObject: function () {
      var object = Scope.superprototype.toObject.call(this);

      object._before = [];
      object._after = [];
      object.scopes = [];
      object.tests = [];

      var _before = this._before;
      var _after = this._after;
      var scopes = this.scopes;
      var tests = this.tests;

      for (var x = 0, nx = _before.length; x < nx; ++x) {
        object._before[x] = _before[x].toObject();
      }

      for (x = 0, nx = _after.length; x < nx; ++x) {
        object._after[x] = _after[x].toObject();
      }

      for (x = 0, nx = scopes.length; x < nx; ++x) {
        object.scopes[x] = scopes[x].toObject();
      }

      for (x = 0, nx = tests.length; x < nx; ++x) {
        object.tests[x] = tests[x].toObject();
      }

      return object;
    }
  });

  return Scope;
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
