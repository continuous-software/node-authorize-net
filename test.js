var conf = require('./config.js');
var auth = require('./index.js');
var assert = require('assert');
var AuthorizeNetError = require('./errors.js').AuthorizeNetError;

describe('AuthorizeNet service', function () {

    var service;

    //to avoid duplicate transaction we change the amoung
    function randomAmount() {
        return Math.ceil(Math.random() * 100);
    }

    beforeEach(function () {
        service = auth(conf.API_LOGIN_ID, conf.TRANSACTION_KEY);
    });

    describe('authorizationCapture', function () {
        it('should submit authorizationCapture request', function (done) {
            service.authCaptureTransaction(randomAmount(), 4012888818888, 2016, 10).then(function (transaction) {
                assert.equal(transaction.responseCode, '1');
                done();
            });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.authCaptureTransaction(randomAmount(), 234234, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                var response = rejection.transactionResponse;
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(response.errors.error.errorCode, 6);
                assert.equal(response.errors.error.errorText, 'The credit card number is invalid.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.authCaptureTransaction(undefined, 4007000000027, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'amount is required');
                done();
            });
        });
    });

    describe('authorization only', function () {
        it('should submit authorization only request', function (done) {
            service.authOnlyTransaction(randomAmount(), 4007000000027, 2016, 2).then(function (transaction) {
                assert.equal(transaction.responseCode, '1');
                done();
            });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.authOnlyTransaction(randomAmount(), 234234, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                var response = rejection.transactionResponse;
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(response.errors.error.errorCode, 6);
                assert.equal(response.errors.error.errorText, 'The credit card number is invalid.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.authOnlyTransaction(undefined, 4007000000027, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'amount is required');
                done();
            });
        });
    });

    describe('capture only', function () {

        it('should submit capture only request', function (done) {

            var amount = randomAmount();
            service.authOnlyTransaction(amount, 4007000000027, 2016, 2)
                .then(function (transaction) {
                    return service.priorAuthCaptureTransaction(transaction.transId, amount);
                })
                .then(function (trans) {
                    assert.equal(trans.responseCode, '1');
                    done();
                });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.priorAuthCaptureTransaction(987, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.priorAuthCaptureTransaction(undefined, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });

    xdescribe('refund transaction', function () {

        it('should submit refund transaction request', function () {

            //todo can not be tested as the settlement happens only once a day
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.refundTransaction(666, 100,4007000000027,2016,1).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.refund(undefined, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });

    describe('void transaction', function () {
        it('should void a transaction request', function (done) {

            service.authOnlyTransaction(randomAmount(), 4007000000027, 2016, 2)
                .then(function (transaction) {
                    return service.voidTransaction(transaction.transId);
                })
                .then(function (trans) {
                    assert.equal(trans.responseCode, '1');
                    done();
                });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.voidTransaction(666).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.voidTransaction(undefined).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });


});
