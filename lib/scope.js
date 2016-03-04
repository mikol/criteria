(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['instance', 'is', 'promise', './runnable', 'type'];

function factory(instance, is, Promise, Runnable, type) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

  /**
   * @const {undefined}
   * @private
   */
  var U;

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
      context: {},
      scopes: [],
      tests: []
    });

    instance.props(this.tests, {
      _before: [],
      _after: []
    });

    findRootScope(parent).applyInScope(fn, this);
  }

  type(Scope)['extends'](Runnable)['implements']({
    before: function () {
      var context = this.context;
      var parentContext = this.scope.context;

      if (is.def(parentContext)) {
        instance.assign(context, parentContext);
      }

      Scope.superprototype.before.call(this, context);

      return Promise.all(this._before.map(function (runnable) {
        var promise = runnable.promise;
        runnable.run(context);
        return promise;
      }));
    },

    after: function (reason, value) {
      Scope.superprototype.after.call(this, reason, value);

      var context = this.context;

      // FIXME: How to surface failures during teardown?
      Promise.all(this._after.map(function (runnable) {
        var promise = runnable.promise;
        runnable.run(context);
        return promise;
      })).catch(function (reason) {
        console.error(reason.stack || reason);
      });
    },

    continue: function () {
      instance.props(this, {
        time: Date.now()
      });

      var scopes = this.scopes;
      var tests = this.tests;
      var pending = scopes.length + tests.length;

      if (pending === 0) {
        return this.resolve();
      }

      // ----------------------------------------------------
      // Process Callbacks

      var self = this;
      function resolve() {
        if (--pending === 0) {
          self.resolve();
        }
      }

      // ----------------------------------------------------
      // Process Scopes

      var soloScopes = false;

      for (var x = 0, nx = scopes.length; x < nx; ++x) {
        if (scopes[x].soloed) {
          soloScopes = true;
          break;
        }
      }

      for (x = 0, nx = scopes.length; x < nx; ++x) {
        var scope = scopes[x];

        if (soloScopes && !scope.soloed) {
          scope.skip();
        }

        scope.run().then(resolve, resolve);
      }

      // ----------------------------------------------------
      // Process Tests

      var soloTests = false;

      for (x = 0, nx = tests.length; x < nx; ++x) {
        if (tests[x].soloed) {
          soloTests = true;
          break;
        }
      }

      for (x = 0, nx = tests.length; x < nx; ++x) {
        var test = tests[x];

        var skip = this.skipped || test.skipped || (soloTests && !test.soloed);

        if (skip) {
          test.skip();
        }

        var returned = test.run(instance.create(this.context));
        if (is.thenable(returned)) {
          returned.then(resolve, resolve);
        } else {
          resolve();
        }
      }
    },

    run: function () {
      if (this.skipped) {
        this.resolve();
        return this.promise;
      }

      var self = this;

      this.promise.then(function (value) {
        self.after(U, value);
      }, function (reason) {
        self.after(reason, U);
      }); // FIXME: Add `catch` for `Test.prototype.after()` throws?

      this.before().then(function () {
        // .before() resolved.
        self.continue();
      }, function (reason) {
        // .before() rejected.
        self.reject(reason);
      }).catch(function (reason) {
        // .continue() rejected.
        self.reject(reason);
      });

      return this.promise;
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
      var scopes = this.scopes;
      var tests = this.tests;

      var object = {
        description: this.description,
        duration: this.duration,
        failed: this.failed,
        output: this.output,
        scopes: [],
        skipped: this.skipped,
        tests: [],
        time: this.time
      };

      for (var x = 0, nx = scopes.length; x < nx; ++x) {
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
