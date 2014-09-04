"use strict";

var _ = require('lodash');
var toJson = require('xml2json').toJson;
var toXml = require('json2xml');
var Promise = require('bluebird');
var request = require('request');
var assert = require('assert');
var errors = require('./errors.js');
var AuthorizeNetError = errors.AuthorizeNetError;
var HttpError = errors.HttpError;

var endpoints = {
    prod: 'https://api.authorize.net/xml/v1/request.api',
    test: 'https://apitest.authorize.net/xml/v1/request.api'
};

function wrap(jsonObject) {
    return '<?xml version="1.0" encoding="utf-8"?>' +
        '<createTransactionRequest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">'
        + toXml(jsonObject)
        + '</createTransactionRequest>';
}

function requestCallBack(resolve, reject, err, response, body) {

    var jsonBody;
    var createTransactionResponse;

    if (err) {
        return reject(err);
    }

    if (response.statusCode >= 400) {
        throw new HttpError(response);
    }

    jsonBody = JSON.parse(toJson(body));
    createTransactionResponse = jsonBody.createTransactionResponse;

    if (createTransactionResponse && createTransactionResponse.messages.resultCode === 'Ok') {
        return resolve(createTransactionResponse.transactionResponse);
    } else {
        return reject(new AuthorizeNetError(jsonBody.createTransactionResponse || jsonBody));
    }
}

function generateRequestConfiguration(service, transactionRequest) {

    var xmlContent = wrap(transactionRequest);

    return {
        url: service.endpoint,
        headers: {
            'Content-Type': 'application/xml',
            'Content-Length': xmlContent.length
        },
        body: xmlContent
    }
}

/**
 * @param apiLogin
 * @param transactionKey
 * @constructor
 */
function AuthorizeNet(apiLogin, transactionKey) {

    assert(apiLogin, 'API login is required');
    assert(transactionKey, 'Transaction key is required');

    this.merchantInfo = {
        name: apiLogin,
        transactionKey: transactionKey
    };
    this.endpoint = process.env.NODE_ENV === 'production' ? endpoints.prod : endpoints.test;
}

/**
 *<p> submit a transaction request type authCaptureTransaction. </p>
 * <ul>
 *  <li>will resolve with an json object representing the <em>transactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 *  <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 *  <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 *  <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 *  <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
 * </ul>
 * @param {number} amount - the amount of the transaction
 * @param {string | number } cardNumber - the card number used for the transaction
 * @param {number} expirationYear - a four digits number for the expiration year of the card
 * @param expirationMonth - one or two digit for the expiration month of the card
 * @param {object} [other] - a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties
 * @returns {Promise}
 */
AuthorizeNet.prototype.authCaptureTransaction = function authCaptureTransaction(amount, cardNumber, expirationYear, expirationMonth, other) {

    var self = this;

    return new Promise(function (resolve, reject) {

        assert(amount, 'amount is required');
        assert(cardNumber, 'cardNumber is required');
        assert(expirationYear, 'expirationYear is required');
        assert(expirationMonth, 'expirationMonth is required');

        var creditCard = { cardNumber: cardNumber, expirationDate: expirationYear.toString() + '-' + expirationMonth.toString() };
        var transactionRequest = {
            merchantAuthentication: self.merchantInfo,
            transactionRequest: {
                transactionType: 'authCaptureTransaction',
                amount: amount,
                payment: {
                    creditCard: creditCard
                }
            }
        };

        _.assign(transactionRequest, other || {});

        request.post(generateRequestConfiguration(self, transactionRequest), requestCallBack.bind(self, resolve, reject));
    });
};

/**
 *<p> submit a transaction request type authOnlyTransaction. </p>
 *  <ul>
 *  <li>will resolve with an json object representing the <em>transactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 *  <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 *  <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 *  <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 *  <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
 * </ul>
 * @param {number} amount - the amount of the transaction
 * @param {string | number } cardNumber - the card number used for the transaction
 * @param {number} expirationYear - a four digits number for the expiration year of the card
 * @param expirationMonth - one or two digit for the expiration month of the card
 * @param {object} [other] - a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties
 * @returns {Promise}
 */
AuthorizeNet.prototype.authOnlyTransaction = function authOnlyTransaction(amount, cardNumber, expirationYear, expirationMonth, other) {

    var self = this;

    return new Promise(function (resolve, reject) {

        assert(amount, 'amount is required');
        assert(cardNumber, 'cardNumber is required');
        assert(expirationYear, 'expirationYear is required');
        assert(expirationMonth, 'expirationMonth is required');

        var creditCard = { cardNumber: cardNumber, expirationDate: expirationYear.toString() + '-' + expirationMonth.toString() };
        var transactionRequest = {
            merchantAuthentication: self.merchantInfo,
            transactionRequest: {
                transactionType: 'authOnlyTransaction',
                amount: amount,
                payment: {
                    creditCard: creditCard
                }
            }
        };

        _.assign(transactionRequest, other || {});

        request.post(generateRequestConfiguration(self, transactionRequest), requestCallBack.bind(self, resolve, reject));
    });
};

/**
 *<p> submit a transaction request type priorAuthCaptureTransaction. </p>
 *  <ul>
 *  <li>will resolve with an json object representing the <em>transactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 *  <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 *  <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 *  <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 *  <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
 * </ul>
 * @param {String|number} refTransId - the transaction reference id returned by the web service after the related authorize only transaction
 * @param {number} amount - the amount of the transaction
 * @param {object} [other] - a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties
 * @returns {Promise}
 */
AuthorizeNet.prototype.priorAuthCaptureTransaction = function captureOnlyTransaction(refTransId, amount, other) {

    var self = this;

    return new Promise(function (resolve, reject) {

        assert(amount, 'amount is required');
        assert(refTransId, 'refTransId is required');

        var transactionRequest = {
            merchantAuthentication: self.merchantInfo,
            transactionRequest: {
                transactionType: 'priorAuthCaptureTransaction',
                amount: amount,
                refTransId: refTransId
            }
        };

        _.assign(transactionRequest, other || {});

        request.post(generateRequestConfiguration(self, transactionRequest), requestCallBack.bind(this, resolve, reject));
    });
};

AuthorizeNet.prototype.refundTransaction = function refundTransaction(refTransId, amount, cardNumber, expirationYear, expirationMonth, other) {
    var self = this;

    return new Promise(function (resolve, reject) {

        assert(refTransId, 'refTransId is required');
        assert(amount, 'amount is required');
        assert(cardNumber, 'cardNumber is required');
        assert(expirationYear, 'expirationYear is required');
        assert(expirationMonth, 'expirationMonth is required');

        var creditCard = { cardNumber: cardNumber, expirationDate: expirationYear.toString() + '-' + expirationMonth.toString() };
        var transactionRequest = {
            merchantAuthentication: self.merchantInfo,
            transactionRequest: {
                transactionType: 'refundTransaction',
                amount: amount,
                refTransId: refTransId,
                payment: {
                    creditCard: creditCard
                }
            }
        };

        _.assign(transactionRequest, other || {});

        request.post(generateRequestConfiguration(self, transactionRequest), requestCallBack.bind(self, resolve, reject));
    });
};

/**
 *<p> submit a transaction request type voidTransaction. </p>
 *  <ul>
 *  <li>will resolve with an json object representing the <em>transactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 *  <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 *  <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 *  <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 *  <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
 * </ul>
 * @param {String|number} refTransId - the transaction reference id (you want to void) returned by the web service.
 * @param {object} [other] - a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties
 * @returns {Promise}
 */
AuthorizeNet.prototype.voidTransaction = function voidTransaction(refTransId, other) {
    var self = this;

    return new Promise(function (resolve, reject) {

        assert(refTransId, 'refTransId is required');

        var transactionRequest = {
            merchantAuthentication: self.merchantInfo,
            transactionRequest: {
                transactionType: 'voidTransaction',
                refTransId: refTransId
            }
        };

        _.assign(transactionRequest, other || {});

        request.post(generateRequestConfiguration(self, transactionRequest), requestCallBack.bind(this, resolve, reject));
    });
};

module.exports = AuthorizeNet;
