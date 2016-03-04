'use strict';

require('../criteria'); /* globals scope, test */

const is = require('is');

scope('A scope defines a shared fixture for related tests.',
function () {
  scope.before(function () {
    this.a = 1;
  });

  scope('Scopes can nest.',
  function () {
    scope.before(function () {
      this.a = 2;
      this.b = 3;
    });

    test('Nested scopes can access outer scope state – and mutate it locally.',
    function (must) {
      must.true(function () {
        return this.a === 2;
      });

      must.true(function () {
        return this.b === 3;
      });

      this.a = 'string';

      must.true(function () {
        return this.a === 'string';
      });
    });
  });

  test('A test asserts that one or more invariants hold true.',
  function (must) {
    must.true(() => true !== false);
  });

  test('A test will fail if it throws any exception – unless we expect it to.',
  function (must) {
    must.throw(() => {
      throw new Error('We should have expected this.');
    });
  });

  test('Nested scope mutations do not affect outer scopes.',
  function (must) {
    must.true(function () {
      return this.a === 1 && is.undefined(this.b);
    });
  });
});

scope('`must.[true|throw|resolve|reject]()` assertions work.',
function () {
  test('`must.true()` expects the return value of a function to be `true`.',
  function (must) {
    var a = 1;
    var b = 1;

    must.true(() => a === b);
  });

  test('`must.throw()` expects a function to throw an exception.',
  function (must) {
    var a = 1;
    var b = 1;

    must.throw(() => a(b));
  });

  test('`return must.resolve(promise)` expects `promise` to succeed.',
  function (must) {
    var promise = new Promise(function (resolve) {
      setTimeout(resolve, 10);
    });

    // Notice the return statement.
    return must.resolve(promise);
  });

  test('`must.resolve()` can check the resolved value.',
  function (must) {
    var promise = new Promise(function (resolve) {
      setTimeout(() => resolve(13), 10);
    });

    // Notice the return statement.
    return must.resolve(promise, function (value) {
      must.true(() => value === 13);
    });
  });

  test('`return must.reject(promise)` expects `promise` to fail.',
  function (must) {
    var promise = new Promise(function (resolve, reject) {
      setTimeout(reject, 10);
    });

    // Notice the return statement.
    return must.reject(promise);
  });

  test('`must.reject()` can check the rejection reason.',
  function (must) {
    var promise = new Promise(function (resolve, reject) {
      setTimeout(() => reject(new Error('!')), 10);
    });

    // Notice the return statement.
    return must.reject(promise, function (reason) {
      must.true(() => reason instanceof Error);
    });
  });

  test('`must` can be aliased to anything.',
  function (debe) {
    debe.true(() => new TypeError() instanceof Error);
  });
});

scope('Test code runs asynchronously between setup and teardown.',
function () {
  var bar = 0;
  var nBeforeTests = 0;
  var nAfterTests = 0;

  scope.before(function () {
    this.foo = 0;
    this.bar = 0;
  });

  test.before(function () {
    ++this.foo;
    ++bar;

    ++nBeforeTests;
  });

  test.after(function () {
    bar = 0;
    ++nAfterTests;
  });

  scope.after(function () {
    this.foo = 0;
  });

  test('Test setup code can be run using `test.before()`.',
  function (must) {
    must.true(() => nBeforeTests > 0 && nAfterTests === 0);
  });

  test('`test.before()` runs for each test.',
  function (must) {
    must.true(function () {
      return bar > 0;
    });
  });

  test('Test teardown code can be run using `test.after()`.',
  function (must) {
    must.true(() => nBeforeTests > 2 && nAfterTests === 2);
  });

  test('Test results are reported in definition order, not completion order.',
  function (must) {
    return must.resolve(new Promise(function (resolve) {
      setTimeout(resolve, 20);
    }));
  });

  test('Scope results are reported in completion order, not definition order.',
  function (must) {
    return must.resolve(new Promise(function (resolve) {
      setTimeout(resolve, 15);
    }));
  });

  test('Outer scope variables are visible to tests and inner scopes.',
  function (must) {
    must.true(function () {
      return is.number(bar);
    });
  });

  test('The `this` object is private to each test.',
  function (must) {
    must.true(() => this.foo === 1);
    must.true(() => this.biz === undefined);
  });

  test('`must` assertions are bound to the correct `this` – sync or async.',
  function (must) {
    must.true(function () { return this.foo === 1; });

    return must.resolve(new Promise(function (resolve) {
      setTimeout(() => { resolve(1); }, 10);
    }), function (value) {
      must.true(function () { return this.foo === value; });
    });
  });

  var scopeRan;

  test('Inner scopes start running before outer scopes.',
  function (must) {
    must.true(() => scopeRan !== undefined);
  });

  test('Inner scopes return control to outer scopes before finishing.',
  function (must) {
    must.true(() => scopeRan === true);
  });

  scope('Inner scope.',
  function () {
    scope.before(function () {
      scopeRan = true;
    });

    scope.after(function () {
      scopeRan = '†';
    });

    test.before(function () {
      scopeRan = '';
    });

    test.after(function () {
      scopeRan = false;
    });

    test('Inner test.',
    function (must) {
      var promise = new Promise(function (resolve) {
        setTimeout(resolve, 10);
      });

      return must.resolve(promise, must.true(() => scopeRan === ''));
    });
  });
});

scope('Scopes can be skipped or run exclusively.',
function () {

  scope('A scope can be disabled using `scope.skip()`.',
  function () {
    var scopeSkipped = true;

    test('Skipped scopes do not appear in test output.',
    function (must) {
      must.true(() => scopeSkipped);
    });

    scope.skip('Skipped scope.',
    function () {
      scope.before(function () {
        scopeSkipped = false;
      });

      test('Will not run.',
      function (must) {
        must.true(() => scopeSkipped);
      });
    });
  });

  scope('Sibling scopes can be prevented from running using `scope.solo()`.',
  function () {
    scope('First of three scopes.',
    function () {
      test('Will not run.', function (must) {
        must.true(() => true);
      });
    });

    scope.solo('Second of three scopes.',
    function () {
      test('Will run.', function (must) {
        must.true(() => true);
      });
    });

    scope('Third of three scopes.',
    function () {
      test('Will not run.', function (must) {
        must.true(() => true);
      });
    });
  });
});

scope('Tests can be skipped or run exclusively.',
  function () {
  scope('A test can be disabled using `test.skip()`.',
  function () {
    test.skip('Test skipped.',
    function (must) {
      must.true(() => false);
    });

    test('Test run.',
    function (must) {
      must.true(() => true);
    });
  });

  scope('Sibling tests can be prevented from running using `test.solo()`.',
  function () {
    test('Will skip.', function (must) {
      must.true(() => true);
    });

    test.solo('Will run.', function (must) {
      return must.resolve(Promise.resolve());
    });

    test('Will skip.', function (must) {
      must.true(() => true);
    });
  });
});
