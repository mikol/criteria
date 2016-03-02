'use strict';

require('../criteria'); /* globals scope, test */

scope('Must Assertion Tests',
function () {
  scope.before(function () {
    this.before = true;
    this.error = new Error('');
  });

  test('Oughta pass.',
  function (must) {
    must.true(() => this.before === true);
  });

  test('Oughta throw.',
  function (must) {
    must.throw(() => this.before.call());
  });

  test('Oughta resolve.',
  function (must) {
    must.resolve(Promise.resolve(this.before), function (value) {
      must.true(() => value === this.before);
    });
  });

  test('Oughta reject.',
  function (must) {
    must.reject(Promise.reject(this.error), function (reason) {
      must.true(() => reason === this.error);
    });
  });
});
