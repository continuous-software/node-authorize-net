var assert = require('assert');
var util = require('util');
var BaseGateway = require('42-cent-base').BaseGateway;
var mapKeys = require('42-cent-util').mapKeys;
var GatewayError = require('42-cent-base').GatewayError;
var Promise = require('bluebird');
var request = require('request');
var toJson = require('xml2json').toJson;
var toXml = require('json2xml');
var post = Promise.promisify(request.post);
var schemas = require('./schemas.js');

var billToSchema = schemas.billing;

var shipToSchema = schemas.shipping;

/**
 *
 * @param options
 * @constructor
 * @augments BaseGateway
 */
function AuthorizeNetGateway(options) {


  assert(options.API_LOGIN_ID, 'API_LOGIN_ID must be provided');
  assert(options.TRANSACTION_KEY, 'TRANSACTION_KEY must be provided');

  this.endpoint = options.testMode === true ? 'https://apitest.authorize.net/xml/v1/request.api' : 'https://api.authorize.net/xml/v1/request.api';

  BaseGateway.call(this, options);
}

util.inherits(AuthorizeNetGateway, BaseGateway);

function setRequest(service, rootNodeName, requestNode) {
  var requestObject = {
    attr: {
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "xmlns": "AnetApi/xml/v1/schema/AnetApiSchema.xsd"
    }
  };

  requestObject[rootNodeName] = {
    merchantAuthentication: {
      name: service.API_LOGIN_ID,
      transactionKey: service.TRANSACTION_KEY
    }
  };

  requestObject[rootNodeName][requestNode.key] = requestNode.value;

  return requestObject;

}

function sendXmlifiedRequest(service, request) {
  var xmlContent = toXml(request, {header: true, attributes_key: 'attr'});

  return post(service.endpoint, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Length': xmlContent.length
    },
    body: xmlContent
  });
}

function createJsonCallback(cb) {

  return function (res, body) {
    var json = JSON.parse(toJson(body));

    if (json.ErrorResponse) {
      throw new GatewayError(json.ErrorResponse.messages.message.text, json.ErrorResponse);
    }

    return cb(json);
  }

}

AuthorizeNetGateway.prototype.sendTransactionRequest = function setTransactionRequest(body, transactionCb) {
  var obj = setRequest(this, 'createTransactionRequest', {
    key: 'transactionRequest',
    value: body
  });

  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {
      if (json.createTransactionResponse) {

        if (json.createTransactionResponse.messages.resultCode === 'Error') {
          throw new GatewayError(json.createTransactionResponse.transactionResponse.errors.error.errorText, json.createTransactionResponse);
        }
        return transactionCb(json.createTransactionResponse.transactionResponse)

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
AuthorizeNetGateway.prototype.submitTransaction = function submitTransaction(order, creditCard, prospect, other) {

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
        cardCode: creditCard.cvv
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

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.authorizeTransaction = function authorizeTransaction(order, creditCard, prospect, other) {

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
        cardCode: creditCard.cvv
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

AuthorizeNetGateway.prototype.getSettledBatchList = function getSettledTransactionsList(from, to) {


  function formatString(date) {

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
AuthorizeNetGateway.prototype.refundTransaction = function refundTransaction(transactionId, options) {

  var opt = options || {};

  if (!opt.expirationMonth || !opt.expirationYear) {
    return Promise.reject(new Error('expirationMonth and expirationYear must be provided in the options object'));
  }

  //fetch missing info if required
  var fullOptions = (!opt.creditCardNumber || !opt.amount) ?
    this.getTransactionDetails(transactionId)
      .then(function (res) {
        opt.amount = opt.amount || res.settleAmount;
        opt.creditCardNumber = opt.creditCardNumber || res.payment.creditCard.cardNumber;
        return opt;
      }) :
    Promise.resolve(opt);


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

AuthorizeNetGateway.prototype.getTransactionList = function getTransactionList(batchId) {

  var obj = setRequest(this, 'getTransactionListRequest', {
    key: 'batchId',
    value: batchId
  });

  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {
      var transactions;
      if (json.getTransactionListResponse) {

        if (json.getTransactionListResponse.messages.resultCode === 'Error') {
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

AuthorizeNetGateway.prototype.getTransactionDetails = function getTransactionDetails(transId) {
  var obj = setRequest(this, 'getTransactionDetailsRequest', {
    key: 'transId',
    value: transId
  });

  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {
      if (json.getTransactionDetailsResponse) {

        if (json.getTransactionDetailsResponse.messages.resultCode === 'Error') {
          throw new GatewayError('some error from the gateway', json.getTransactionDetailsResponse);
        }

        return json.getTransactionDetailsResponse.transaction;

      } else {
        throw new Error('Can not parse answer from gateway');
      }
    }));
};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.voidTransaction = function voidTransaction(transactionId) {

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

  options = options || {};

  var body = {
    merchantCustomerId: options.merchantCustomerId || '',
    description: options.description || '',
    email: billing.customerEmail,
    paymentProfiles: {
      payment: {
        creditCard: {
          cardNumber: payment.creditCardNumber,
          expirationDate: [payment.expirationYear.toString(), payment.expirationMonth.toString()].join('-'),
          cardCode: payment.cvv
        }
      }
    }
  };

  var obj = setRequest(this, 'createCustomerProfileRequest', {
    key: 'profile',
    value: body
  });

  obj.createCustomerProfileRequest.validationMode = this.testMode ? 'testMode' : 'none';


  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {

      var errors;

      if (json.createCustomerProfileResponse) {

        if (json.createCustomerProfileResponse.messages.resultCode === 'Error') {

          errors = json.createCustomerProfileResponse.messages.message;
          errors = errors.length > 1 ? errors : [errors];

          throw new GatewayError(errors.reduce(function (previous, current) {
            previous += '- ' + current.text;
            return previous;
          }, ''), json.createCustomerProfileResponse);
        }

        return {
          profileId: json.createCustomerProfileResponse.customerProfileId,
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

      var paymentProfile = res._original.profile.paymentProfiles;
      paymentProfile = paymentProfile.length > 1 ? paymentProfile : [paymentProfile];

      var body = {
        transactionType: 'authCaptureTransaction',
        amount: order.amount,
        profile: {
          customerProfileId: prospect.profileId,
          paymentProfile: {
            paymentProfileId: paymentProfile[0].customerPaymentProfileId
          }
        }
      };

      return this.sendTransactionRequest(body, function (transaction) {
        return {
          authCode: transaction.authCode,
          _original: transaction,
          transactionId: transaction.transId
        }
      });
    }.bind(this));


};

/**
 * @inheritDoc
 */
AuthorizeNetGateway.prototype.getCustomerProfile = function getCustomerProfile(profileId) {

  var req = setRequest(this, 'getCustomerProfileRequest', {key: 'customerProfileId', value: profileId});

  return sendXmlifiedRequest(this, req)
    .spread(createJsonCallback(function (json) {
      if (json.getCustomerProfileResponse) {

        var errors;

        if (json.getCustomerProfileResponse.messages.resultCode === 'Error') {
          errors = json.getCustomerProfileResponse.messages.message;
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
AuthorizeNetGateway.prototype.createSubscription = function createSubscription(cc, prospect, subscriptionPlan, other) {
  if (other) {
    console.log('other is not supported yet');
  }

  function formatString(date) {

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
        cardCode: cc.cvv
      }
    },
    billTo: mapKeys(prospect, billToSchema)
  };

  var obj = setRequest(this, 'ARBCreateSubscriptionRequest', {
    key: 'subscription',
    value: body
  });

  return sendXmlifiedRequest(this, obj)
    .spread(createJsonCallback(function (json) {
      if (json.ARBCreateSubscriptionResponse) {

        var errors;

        if (json.ARBCreateSubscriptionResponse.messages.resultCode === 'Error') {
          errors = json.ARBCreateSubscriptionResponse.messages.message;
          errors = errors.length > 1 ? errors : [errors];
          throw new GatewayError(errors.reduce(function (previous, current) {
            previous += '- ' + current.text;
            return previous;
          }, ''), json.ARBCreateSubscriptionResponse);
        }

        return {
          subscriptionId: json.ARBCreateSubscriptionResponse.subscriptionId,
          _original: json.ARBCreateSubscriptionResponse
        };

      } else {
        throw new Error('Can not parse the answer from the gateway');
      }


    }));
};

module.exports = AuthorizeNetGateway;


