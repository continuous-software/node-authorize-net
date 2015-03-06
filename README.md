[![build status](https://travis-ci.org/continuous-software/node-authorize-net.svg?branch=master)](https://travis-ci.org/continuous-software/node-authorize-net)

![node-authorize-net](http://www.merchantbottomline.com/images/authorizenet.png)

## Installation

    $ npm install -s authorize-net

## Usage

This SDK is natively compatible with [42-cent](https://github.com/continuous-software/42-cent).  
It implements the [BaseGateway](https://github.com/continuous-software/42-cent-base) API.


##Example
var PaymentGateway = require('node-authorize-net');

randomAmount = function() {
  Math.ceil(Math.random() * 300);
}

var authorizeNet = new PaymentGateway("2msN9nrBG8K", "43jNykM6kC8v87Nb");

authorizeNet.authCaptureTransaction(randomAmount(), '4012888818888', '2017', '1').then(function(result) {
  console.log result.transactionResponse;
}).catch( function (err) {
  console.log(err);
})


