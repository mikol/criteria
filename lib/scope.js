/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  'instance',
  'is',
  'promise',
  './runnable',
  'type'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (instance, is, Promise, Runnable, type) {
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

    if (!fn) {
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

      if (parentContext) {
        instance.assign(context, parentContext);
      }

      Scope.superprototype.before.call(this, context);

      return Promise.all(this._before.map(function (runnable) {
        var promise = runnable.makePromise();
        runnable.run(context);
        return promise;
      }));
    },

    after: function (reason, value) {
      Scope.superprototype.after.call(this, reason, value);

      var context = this.context;

      // FIXME: How to surface failures during teardown?
      Promise.all(this._after.map(function (runnable) {
        var promise = runnable.makePromise();
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
});
