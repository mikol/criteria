/* jshint ignore:start *//* jscs:disable */
!function(e,o){'use strict';var t=[
  'instance',
  'observable',
  './runnable',
  './scope',
  './test',
  'type'
];if('function'==typeof define&&define.amd)define(t,function(){return o.apply(e,[].slice.call(arguments))});else if('object'==typeof module&&module.exports){for(var n=t.length;n--;)t[n]=require(t[n]);module.exports=o.apply(e,t)}}('object'==typeof global&&global||'object'==typeof window&&window||this,

function (instance, Observable, Runnable, Scope, Test, type) {
/* jshint ignore:end   *//* jscs:enable  */
  'use strict';

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

          runner.trigger('finish', runner);
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
      if (collection) {
        collection[collection.length] = scope;
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
      collection[collection.length] = test;

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
      if (typeof description === 'function') {
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

      collection[collection.length] = runnable;
    },

    after: function (description, fn, timeout) {
      if (typeof description === 'function') {
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

      collection[collection.length] = runnable;
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
      if (typeof description === 'function') {
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

      collection[collection.length] = runnable;
    },

    after: function (description, fn, timeout) {
      if (typeof description === 'function') {
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

      collection[collection.length] = runnable;
    },

    skip: function (description, fn, timeout) {
      runner.trigger('test', runner.makeTest(description, fn, timeout).skip());
    },

    solo: function (description, fn, timeout) {
      runner.trigger('test', runner.makeTest(description, fn, timeout).solo());
    }
  });

  return runner;
});