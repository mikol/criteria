'use strict';

require('../criteria'); /* globals scope, test */

scope('Must Assertion Tests',
function () {
  var error = new Error('');

  scope.before(function () {
    this.before = true;
    this.error = error;
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
    var self = this;
    return must.resolve(Promise.resolve(true), function (value) {
      must.true(() => value === self.before);
    });
  });

  test('Oughta reject.',
  function (must) {
    var self = this;
    return must.reject(Promise.reject(error), function (reason) {
      must.true(() => reason === self.error);
    });
  });
});
