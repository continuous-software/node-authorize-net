var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var casual = require('casual');

describe('create customer profile', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should create a customer profile', function (done) {
    var cc = new CreditCard()
      .withCreditCardNumber('4111111111111111')
      .withExpirationMonth('12')
      .withExpirationYear('2017')
      .withCvv2('123');

    var prospect = new Prospect()
      .withBillingEmailAddress(casual.email)
      .withBillingLastName(casual.last_name)
      .withBillingFirstName(casual.first_name)
      .withBillingAddress1(casual.address)
      .withBillingCity(casual.city)
      .withBillingPostalCode(casual.zip)
      .withBillingState(casual.state)
      .withBillingCountry(casual.country_code)
      .withShippingLastName(casual.last_name)
      .withShippingFirstName(casual.first_name)
      .withShippingAddress1(casual.address)
      .withShippingCity(casual.city)
      .withShippingPostalCode(casual.zip)
      .withShippingState(casual.state)
      .withShippingCountry(casual.country_code);


    var options = {
      description: 'TEST at: ' + Date.now()
    };

    service.createCustomerProfile(cc, prospect, prospect, options)
      .then(function (result) {
        assert(result.profileId, ' profileId Should be defined');
        assert(result._original, '_original should be defined');
        done();
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  it('should reject the promise when the gateway return an error', function (done) {
    var cc = new CreditCard()
      .withCreditCardNumber('2323455')
      .withExpirationMonth('12')
      .withExpirationYear('2017')
      .withCvv2('123');

    var prospect = new Prospect()
      .withBillingEmailAddress(casual.email)
      .withBillingLastName(casual.last_name)
      .withBillingFirstName(casual.first_name)
      .withBillingAddress1(casual.address)
      .withBillingCity(casual.city)
      .withBillingPostalCode(casual.zip)
      .withBillingState(casual.state)
      .withBillingCountry(casual.country_code)
      .withShippingLastName(casual.last_name)
      .withShippingFirstName(casual.first_name)
      .withShippingAddress1(casual.address)
      .withShippingCity(casual.city)
      .withShippingPostalCode(casual.zip)
      .withShippingState(casual.state)
      .withShippingCountry(casual.country_code);

    service.createCustomerProfile(cc, prospect)
      .then(function (result) {
        throw new Error('it should not get here');
      }, function (err) {
        assert(err instanceof GatewayError);
        assert(err._original, '_original should be defined');
        assert(err.message.indexOf('- The field length is invalid for Card Number.') != -1);
        done();
      });
  });

});
