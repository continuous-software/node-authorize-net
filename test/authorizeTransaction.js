var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var Order = require('42-cent-model').Order;
var casual = require('casual');
var randomAmount = require('./fixtures/utils.js').randomAmount;

describe('authorize only', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should submit transaction request', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('4012888818888')
      .withExpirationYear(2019)
      .withExpirationMonth('1')
      .withCvv2('666');

    var order = new Order()
      .withAmount(randomAmount());

    return service.authorizeTransaction(order, cc).then(function (result) {
      assert.equal(result.authCode, result._original.authCode);
      assert.equal(result.transactionId, result._original.transId);
    });
  });

  it('should support prospect avs fields', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('4012888818888')
      .withExpirationYear(2019)
      .withExpirationMonth('1')
      .withCvv2('666');

    var prospect = new Prospect()
      .withBillingLastName(casual.last_name)
      .withBillingFirstName(casual.first_name)
      .withBillingAddress1(casual.address.substr(0, 30))
      .withBillingCity(casual.city)
      .withBillingPostalCode(casual.zip)
      .withBillingState(casual.state)
      .withBillingCountry(casual.country_code)
      .withShippingLastName(casual.last_name)
      .withShippingFirstName(casual.first_name)
      .withShippingAddress1(casual.address.substr(0, 30))
      .withShippingCity(casual.city)
      .withShippingPostalCode(casual.zip)
      .withShippingState(casual.state)
      .withShippingCountry(casual.country_code);

    var order = new Order()
      .withAmount(randomAmount());

    return service.authorizeTransaction(order, cc, prospect).then(function (result) {
      assert.equal(result.authCode, result._original.authCode);
      assert.equal(result.transactionId, result._original.transId);
    });
  });

  it('should reject the promise when web service send an error code', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('234234')
      .withExpirationMonth('10')
      .withExpirationYear('2010')
      .withCvv2('666');

    var order = new Order()
      .withAmount(randomAmount());

    return service.authorizeTransaction(order, cc).then(function () {
        throw new Error('Was not rejected.');
      })
      .catch(function (err) {
        assert.ok(err instanceof GatewayError, 'expected instance of GatewayError');
        assert.equal(err.message, 'The credit card number is invalid.');
        assert.ok(err._original, '_original should be defined');
      });
  });

});
