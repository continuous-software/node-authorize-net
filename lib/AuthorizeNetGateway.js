var assert = require('assert');
var util = require('util');
var BaseGateway = require('42-cent-base').BaseGateway;
var mapKeys = require('42-cent-util').mapKeys;
var GatewayError = require('42-cent-base').GatewayError;
var P = require('bluebird');
var request = require('request');
var toJson = P.promisify(require('xml2js').parseString);
var xml2js = require('xml2js');
var post = P.promisify(request.post);
var schemas = require('./schemas.js');

var billToSchema = schemas.billing;

var shipToSchema = schemas.shipping;

/**
 *
 * @param options
 * @constructor
 * @augments BaseGateway
 */
function AuthorizeNetGateway (options) {


  assert(options.API_LOGIN_ID, 'API_LOGIN_ID must be provided');
  assert(options.TRANSACTION_KEY, 'TRANSACTION_KEY must be provided');

  this.endpoint = options.testMode === true ? 'https://apitest.authorize.net/xml/v1/request.api' : 'https://api.authorize.net/xml/v1/request.api';

  BaseGateway.call(this, options);
}

util.inherits(AuthorizeNetGateway, BaseGateway);

function setRequest (service, rootNodeName, requestNode) {
  var requestObject = {};

  requestObject[rootNodeName] = {
    $: {
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "xmlns": "AnetApi/xml/v1/schema/AnetApiSchema.xsd"
    },
    merchantAuthentication: {
      name: service.API_LOGIN_ID,
      transactionKey: service.TRANSACTION_KEY
    }
  };

  requestObject[rootNodeName][requestNode.key] = requestNode.value;

  return requestObject;

}

function sendXmlifiedRequest (service) {

  return function (request) {
    return P.resolve()
      .then(function () {
        var builder = new xml2js.Builder();
        var xmlContent = builder.buildObject(request);
        return post(service.endpoint, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': xmlContent.length
          },
          body: xmlContent
        })
      });
  }
}

function createJsonCallback (cb) {

  return function (res, body) {
    return toJson(body)
      .then(function (result) {
        var json = result;

        if (json.ErrorResponse) {
          throw new GatewayError(json.ErrorResponse[0].messages[0].message[0].text[0], json.ErrorResponse[0]);
        }

        return cb(json);
      });
  }
}

AuthorizeNetGateway.prototype.sendTransactionRequest = function setTransactionRequest (body, transactionCb) {

  var service = this;

  return P.resolve()
    .then(function () {
      return setRequest(service, 'createTransactionRequest', {
        key: 'transactionRequest',
        value: body
      });
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {
      if (json.createTransactionResponse) {

        if (json.createTransactionResponse.messages[0].resultCode[0] === 'Error') {
          throw new GatewayError(json.createTransactionResponse.transactionResponse[0].errors[0].error[0].errorText[0], json.createTransactionResponse);
        }
        return transactionCb(json.createTransactionResponse.transactionResponse[0])

      } else {
        throw new Error('Can not parse answer from gateway');
      }
    }))
};

/**
 * @inheritDoc
 *
 * note the customer id must come from the merchant ie profileId
 */
AuthorizeNetGateway.prototype.submitTransaction = function submitTransaction (order, creditCard, prospect, other) {

  if (other) {
    console.log('other is not supported');
  }

  var expirationYear = creditCard.expirationYear.toString().length === 4 ? creditCard.expirationYear.toString().substr(-2) : creditCard.expirationYear.toString();
  var expirationMonth = creditCard.expirationMonth.toString().length === 2 ? creditCard.expirationMonth.toString() : '0' + creditCard.expirationMonth.toString();
  var body = {
    transactionType: 'authCaptureTransaction',
    amount: order.amount,
    payment: {
      creditCard: {
        cardNumber: creditCard.creditCardNumber,
        expirationDate: expirationMonth + expirationYear,
        cardCode: creditCard.cvv2
      }
    }
  };

  if (prospect) {
    body.billTo = mapKeys(prospect, billToSchema);
    body.shipTo = mapKeys(prospect, shipToSchema);
  }

  return this.sendTransactionRequest(body, function (transaction) {
    return {
      authCode: transaction.authCode[0],
      _original: transaction,
      transactionId: transaction.transId[0]
    }
  });
};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.authorizeTransaction = function authorizeTransaction (order, creditCard, prospect, other) {

  if (other) {
    console.log('other is not supported');
  }

  var expirationYear = creditCard.expirationYear.toString().length === 4 ? creditCard.expirationYear.toString().substr(-2) : creditCard.expirationYear.toString();
  var expirationMonth = creditCard.expirationMonth.toString().length === 2 ? creditCard.expirationMonth.toString() : '0' + creditCard.expirationMonth.toString();
  var body = {
    transactionType: 'authOnlyTransaction',
    amount: order.amount,
    payment: {
      creditCard: {
        cardNumber: creditCard.creditCardNumber,
        expirationDate: expirationMonth + expirationYear,
        cardCode: creditCard.cvv2
      }
    }
  };

  if (prospect) {
    body.billTo = mapKeys(prospect, billToSchema);
    body.shipTo = mapKeys(prospect, shipToSchema);
  }

  return this.sendTransactionRequest(body, function (transaction) {
    return {
      authCode: transaction.authCode,
      _original: transaction,
      transactionId: transaction.transId
    }
  });
};

AuthorizeNetGateway.prototype.getSettledBatchList = function getSettledTransactionsList (from, to) {


  function formatString (date) {

    var monthString;
    var dayString;
    var hourString;
    var minuteString;

    monthString = (date.getUTCMonth() + 1).toString();
    monthString = monthString.length === 2 ? monthString : '0' + monthString;

    dayString = (date.getUTCDate()).toString();
    dayString = dayString.length === 2 ? dayString : '0' + dayString;

    hourString = (date.getUTCHours()).toString();
    hourString = hourString.length === 2 ? hourString : '0' + hourString;

    minuteString = (date.getUTCMinutes()).toString();
    minuteString = minuteString.length === 2 ? minuteString : '0' + minuteString;


    return date.getUTCFullYear() + '-' + monthString + '-' + dayString + 'T' + hourString + ':' + minuteString + ':00Z';
  }

  var obj = setRequest(this, 'getSettledBatchListRequest', {
    key: 'includeStatistics',
    value: true
  });

  to = to || new Date();
  obj.getSettledBatchListRequest.firstSettlementDate = formatString(new Date(from));
  obj.getSettledBatchListRequest.lastSettlementDate = formatString(new Date(to));

  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {
      var batchList;
      if (json.getSettledBatchListResponse) {

        if (json.getSettledBatchListResponse.messages.resultCode === 'Error') {
          throw new GatewayError(json.getSettledBatchListResponse.transactionResponse.errors.error.errorText, json.getSettledBatchListResponse);
        }

        batchList = json.getSettledBatchListResponse.batchList.batch;
        batchList = batchList.length > 1 ? batchList : [batchList];

        return batchList.map(function (batch) {
          var statArray = [];
          var output = {
            batchId: batch.batchId,
            settlementDate: batch.settlementTimeUTC,
            chargeAmount: 0,
            chargeCount: 0,
            refundAmount: 0,
            refundCount: 0,
            voidCount: 0,
            declineCount: 0,
            errorCount: 0
          };

          if (batch.statistics && batch.statistics.statistic) {

            statArray = batch.statistics.statistic.length && batch.statistics.statistic.forEach ?
              batch.statistics.statistic
              : [batch.statistics.statistic];

            statArray.forEach(function (value) {
              output.chargeAmount += +(value.chargeAmount);
              output.chargeCount += +(value.chargeCount);
              output.refundAmount += +(value.refundAmount);
              output.refundCount += +(value.refundCount);
              output.voidCount += +(value.voidCount);
              output.declineCount += +(value.declineCount);
              output.errorCount += +(value.errorCount);
            });
          }

          return output;
        });

      } else {
        throw new Error('Can not parse answer from gateway');
      }
    }));
};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.refundTransaction = function refundTransaction (transactionId, options) {

  var opt = options || {};

  if (!opt.expirationMonth || !opt.expirationYear) {
    return P.reject(new Error('expirationMonth and expirationYear must be provided in the options object'));
  }

  //fetch missing info if required
  var fullOptions = (!opt.creditCardNumber || !opt.amount) ?
    this.getTransactionDetails(transactionId)
      .then(function (res) {
        opt.amount = +(opt.amount || res.settleAmount[0]).toFixed(2);
        opt.creditCardNumber = opt.creditCardNumber || res.payment[0].creditCard[0].cardNumber[0];
        return opt;
      }) :
    P.resolve(opt);


  return fullOptions.then(function (fullOpt) {
    fullOpt.creditCardNumber = fullOpt.creditCardNumber.substr(-4);

    return this.sendTransactionRequest({
      transactionType: 'refundTransaction',
      amount: fullOpt.amount,
      payment: {
        creditCard: {
          cardNumber: fullOpt.creditCardNumber,
          expirationDate: fullOpt.expirationMonth + fullOpt.expirationYear
        }
      },
      refTransId: transactionId
    }, function (transaction) {
      return {
        _original: transaction
      };
    });

  }.bind(this))
    .catch(function (error) {
      var err = error;
      if (error.transactionResponse) {
        err = new GatewayError(error.transactionResponse.errors.error.errorText, error);
      }
      throw err;
    });
};

AuthorizeNetGateway.prototype.getTransactionList = function getTransactionList (batchId) {

  var service = this;

  return P.resolve()
    .then(function () {
      return setRequest(service, 'createTransactionRequest', {
        key: 'batchId',
        value: batchId
      });
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {
      var transactions;
      if (json.getTransactionListResponse) {

        if (json.getTransactionListResponse.messages[0].resultCode[0] === 'Error') {
          throw new GatewayError('some error from the gateway', json.getTransactionListResponse);
        }

        transactions = json.getTransactionListResponse.transactions;
        transactions = transactions.length > 1 ? transactions : [transactions];

        return transactions;

      } else {
        throw new Error('Can not parse answer from gateway');
      }
    }));
};

AuthorizeNetGateway.prototype.getTransactionDetails = function getTransactionDetails (transId) {

  var service = this;

  return P.resolve()
    .then(function () {
      return setRequest(service, 'getTransactionDetailsRequest', {
        key: 'transId',
        value: transId
      });
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {
      if (json.getTransactionDetailsResponse) {

        if (json.getTransactionDetailsResponse.messages[0].resultCode[0] === 'Error') {
          throw new GatewayError('some error from the gateway', json.getTransactionDetailsResponse);
        }

        return json.getTransactionDetailsResponse.transaction[0];

      } else {
        throw new Error('Can not parse answer from gateway');
      }
    }));
};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.voidTransaction = function voidTransaction (transactionId) {

  return this.sendTransactionRequest({
    transactionType: 'voidTransaction',
    refTransId: transactionId
  }, function (transaction) {
    return {_original: transaction};
  });
};

/**
 * @inheritDoc
 *
 * customerEmail is required
 *
 */
AuthorizeNetGateway.prototype.createCustomerProfile = function (payment, billing, shipping, options) {

  var service = this;

  return P.resolve()
    .then(function () {
      options = options || {};

      var body = {
        merchantCustomerId: options.merchantCustomerId || '',
        description: options.description || '',
        email: billing.billingEmailAddress,
        paymentProfiles: {
          payment: {
            creditCard: {
              cardNumber: payment.creditCardNumber,
              expirationDate: [payment.expirationYear.toString(), payment.expirationMonth.toString()].join('-'),
              cardCode: payment.cvv2
            }
          }
        }
      };

      var obj = setRequest(service, 'createCustomerProfileRequest', {
        key: 'profile',
        value: body
      });

      obj.createCustomerProfileRequest.validationMode = this.testMode ? 'testMode' : 'none';

      return obj;
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {

      var errors;

      if (json.createCustomerProfileResponse) {

        if (json.createCustomerProfileResponse.messages[0].resultCode[0] === 'Error') {

          errors = json.createCustomerProfileResponse.messages[0].message[0];
          errors = errors.length > 1 ? errors : [errors];

          throw new GatewayError(errors.reduce(function (previous, current) {
            previous += '- ' + current.text;
            return previous;
          }, ''), json.createCustomerProfileResponse);
        }

        return {
          profileId: json.createCustomerProfileResponse.customerProfileId[0],
          _original: json.createCustomerProfileResponse
        };

      } else {
        throw new Error('Can not parse the answer from the gateway');
      }
    }));

};

/**
 * @inheritsDoc
 * IMPORTANT TO NOTE,at the moment if the customer has several payment profiles the payment profile used will always be the first one
 */
AuthorizeNetGateway.prototype.chargeCustomer = function (order, prospect, other) {

  if (other) {
    console.log('other is not supported');
  }

  return this.getCustomerProfile(prospect.profileId)
    .then(function (res) {

      var paymentProfile = res._original.profile[0].paymentProfiles;
      paymentProfile = paymentProfile.length > 1 ? paymentProfile : [paymentProfile];

      var body = {
        transactionType: 'authCaptureTransaction',
        amount: order.amount,
        profile: {
          customerProfileId: prospect.profileId,
          paymentProfile: {
            paymentProfileId: paymentProfile[0][0].customerPaymentProfileId[0]
          }
        }
      };

      return this.sendTransactionRequest(body, function (transaction) {
        return {
          authCode: transaction.authCode[0],
          _original: transaction,
          transactionId: transaction.transId[0]
        }
      });
    }.bind(this));


};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.getCustomerProfile = function getCustomerProfile (profileId) {

var service = this;
  return P.resolve()
    .then(function () {
      return  setRequest(service, 'getCustomerProfileRequest', {key: 'customerProfileId', value: profileId});
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {
      if (json.getCustomerProfileResponse) {

        var errors;

        if (json.getCustomerProfileResponse.messages[0].resultCode[0] === 'Error') {
          errors = json.getCustomerProfileResponse.messages[0].message[0];
          errors = errors.length > 1 ? errors : [errors];
          throw new GatewayError(errors.reduce(function (previous, current) {
            previous += '- ' + current.text;
            return previous;
          }, ''), json.getCustomerProfileResponse);
        }

        return {
          _original: json.getCustomerProfileResponse
        };

      } else {
        throw new Error('Can not parse the answer from the gateway');
      }
    }));
};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.createSubscription = function createSubscription (cc, prospect, subscriptionPlan, other) {
  if (other) {
    console.log('other is not supported yet');
  }

  function formatString (date) {

    var monthString;
    var dayString;
    var yearString;

    monthString = (date.getUTCMonth() + 1).toString();
    monthString = monthString.length === 2 ? monthString : '0' + monthString;

    dayString = (date.getUTCDate()).toString();
    dayString = dayString.length === 2 ? dayString : '0' + dayString;

    yearString = (date.getUTCFullYear()).toString();

    return yearString + '-' + monthString + '-' + dayString;
  }

  var service = this;

  return P.resolve()
    .then(function () {
      var expirationYear = cc.expirationYear.toString().length === 4 ? cc.expirationYear.toString().substr(-2) : cc.expirationYear.toString();
      var expirationMonth = cc.expirationMonth.toString().length === 2 ? cc.expirationMonth.toString() : '0' + cc.expirationMonth.toString();
      var startDate = new Date(subscriptionPlan.startingDate);
      var body = {
        paymentSchedule: {
          interval: {
            length: subscriptionPlan.periodLength || 1,
            unit: subscriptionPlan.periodUnit || 'months'
          },
          startDate: formatString(startDate),
          totalOccurrences: subscriptionPlan.iterationCount,
          trialOccurrences: subscriptionPlan.trialCount || 0
        },
        amount: subscriptionPlan.amount,
        trialAmount: subscriptionPlan.trialAmount || 0,
        payment: {
          creditCard: {
            cardNumber: cc.creditCardNumber,
            expirationDate: expirationMonth + expirationYear,
            cardCode: cc.cvv2
          }
        },
        billTo: mapKeys(prospect, billToSchema)
      };

      return setRequest(service, 'ARBCreateSubscriptionRequest', {
        key: 'subscription',
        value: body
      });
    })
    .then(sendXmlifiedRequest(service))
    .spread(createJsonCallback(function (json) {
      if (json.ARBCreateSubscriptionResponse) {

        var errors;

        if (json.ARBCreateSubscriptionResponse.messages[0].resultCode[0] === 'Error') {
          errors = json.ARBCreateSubscriptionResponse.messages[0].message[0];
          errors = errors.length > 1 ? errors : [errors];
          throw new GatewayError(errors.reduce(function (previous, current) {
            previous += '- ' + current.text;
            return previous;
          }, ''), json.ARBCreateSubscriptionResponse);
        }

        return {
          subscriptionId: json.ARBCreateSubscriptionResponse.subscriptionId[0],
          _original: json.ARBCreateSubscriptionResponse
        };

      } else {
        throw new Error('Can not parse the answer from the gateway');
      }
    }));
};

module.exports = AuthorizeNetGateway;


