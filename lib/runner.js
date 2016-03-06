(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = [
  'defer',
  'instance',
  'is',
  'observable',
  './runnable',
  './scope',
  './test'
];

function factory(defer, instance, is, Observable, Runnable, Scope, Test) {
  var runner = instance.create(Observable.prototype);
  Observable.call(runner);

  instance.props(runner, {
    _scope: {
      value: runner,
      writable: true
    },

    scopes: [],

    /**
     * FIXME: Doucment.
     */
    applyInScope: function (fn, scope, argv) {
      var _scope = runner._scope;
      runner._scope = scope;

      fn.apply(scope, argv);

      runner._scope = _scope;
    },

    run: function () {
      instance.props(runner, {
        time: Date.now()
      });

      var scopes = runner.scopes;
      var soloScopes = false;

      for (var x = 0, nx = scopes.length; x < nx; ++x) {
        if (scopes[x].soloed) {
          soloScopes = true;
          break;
        }
      }

      var finished = 0;
      for (x = 0; x < nx; ++x) {
        var scope = scopes[x];

        scope.promise.then(finish, finish);

        if (soloScopes && !scope.soloed) {
          scope.skip();
        }

        scope.run();
      }

      function finish() {
        if (++finished === nx) {
          instance.props(runner, {
            duration: Date.now() - (runner.time || Date.now()),
          });

          defer(function () {
            runner.trigger('finish', runner);
          });
        }
      }
    },

    /**
     * @private
     */
    makeScope: function (description, fn) {
      var parent = runner._scope;
      var scope = new Scope(parent, description, fn);

      var collection = parent.scopes;
      if (is.def(collection)) {
        collection.push(scope);
      } else {
        // `scope` is a child of the root scope.
        runner.scopes[runner.scopes.length] = scope;
      }

      return scope;
    },

    /**
     * @private
     */
    makeTest: function (description, fn, timeout) {
      var scope = runner._scope;
      var test = new Test(scope, description, fn, timeout);

      var collection = scope.tests;
      collection.push(test);

      return test;
    },

    /**
     * FIXME: Doucment.
     */
    scope: function (description, fn) {
      runner.trigger('scope', runner.makeScope(description, fn));
    },

    /**
     * FIXME: Doucment.
     */
    test: function (description, fn, timeout) {
      runner.trigger('test', runner.makeTest(description, fn, timeout));
    }
  });

  instance.props(runner.scope, {
    before: function (description, fn, timeout) {
      if (is.function(description)) {
        fn = description;
        description = '';
      } else {
        description = ' ' + description;
      }

      var scope = runner._scope;
      var collection = scope._before;

      description = scope.description +
        ' scope.before[' + collection.length + ']' + description;

      var runnable = new Runnable(scope, description, fn, timeout);

      collection.push(runnable);
    },

    after: function (description, fn, timeout) {
      if (is.function(description)) {
        fn = description;
        description = '';
      } else {
        description = ' ' + description;
      }

      var scope = runner._scope;
      var collection = scope._after;

      description = scope.description +
        ' scope.after[' + collection.length + ']' + description;

      var runnable = new Runnable(scope, description, fn, timeout);

      collection.push(runnable);
    },

    skip: function (description, fn) {
      runner.trigger('scope', runner.makeScope(description, fn).skip());
    },

    solo: function (description, fn) {
      runner.trigger('scope', runner.makeScope(description, fn).solo());
    }
  });

  instance.props(runner.test, {
    before: function (description, fn, timeout) {
      if (is.function(description)) {
        fn = description;
        description = '';
      } else {
        description = ' ' + description;
      }

      var scope = runner._scope;
      var collection = scope.tests._before;

      description = scope.description +
        ' test.before[' + collection.length + ']' + description;

      var runnable = new Runnable(scope, description, fn, timeout);

      collection.push(runnable);
    },

    after: function (description, fn, timeout) {
      if (is.function(description)) {
        fn = description;
        description = '';
      } else {
        description = ' ' + description;
      }

      var scope = runner._scope;
      var collection = scope.tests._after;

      description = scope.description +
        ' test.after[' + collection.length + ']' + description;

      var runnable = new Runnable(scope, description, fn, timeout);

      collection.push(runnable);
    },

    skip: function (description, fn, timeout) {
      runner.trigger('test', runner.makeTest(description, fn, timeout).skip());
    },

    solo: function (description, fn, timeout) {
      runner.trigger('test', runner.makeTest(description, fn, timeout).solo());
    }
  });

  return runner;
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
