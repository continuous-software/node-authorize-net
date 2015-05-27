[![build status](https://travis-ci.org/continuous-software/node-authorize-net.svg?branch=master)](https://travis-ci.org/continuous-software/node-authorize-net)

![node-authorize-net](http://www.merchantbottomline.com/images/authorizenet.png)

## Installation

    $ npm install -s authorize-net

## Usage

```javascript
var AuhorizeNet = require('authorize-net');
var client = new AuthorizeNet({
  API_LOGIN_ID: '<PLACEHOLDER>',
  TRANSACTION_KEY: '<PLACEHOLDER>'
});
```

## Gateway API

This SDK is natively compatible with [42-cent](https://github.com/continuous-software/42-cent).  
It implements the [BaseGateway](https://github.com/continuous-software/42-cent-base) API.
