# tz-mpesa-ussd-push

[![Build module-starter](https://travis-ci.org/lykmapipo/tz-mpesa-ussd-push.svg?branch=master)](https://travis-ci.org/lykmapipo/tz-mpesa-ussd-push)
[![Dependencies module-starter](https://david-dm.org/lykmapipo/tz-mpesa-ussd-push.svg?style=flat-square)](https://david-dm.org/lykmapipo/tz-mpesa-ussd-push)

Vodacom-Tanzania USSD Push API Client.

## Requirements

- [NodeJS v8.11.1+](https://nodejs.org)
- [npm v5.6.0+](https://www.npmjs.com/)

## Installation

```sh
npm install --save @lykmapipo/tz-mpesa-ussd-push
```

## Usage
```js
const { login } = require('@lykmapipo/tz-mpesa-ussd-push');

const credentials = { username: '123000', password: '123@123' };
login(credentials, (error, response, body) => { ... });
// => body: { sessionId: ..., transactionId: ... }
```

## Environment
```js
TZ_MPESA_USSD_PUSH_USERNAME=
TZ_MPESA_USSD_PUSH_PASSWORD=
TZ_MPESA_USSD_PUSH_BUSINESS_NAME=
TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER=
TZ_MPESA_USSD_PUSH_CALLBACK_URL=
TZ_MPESA_USSD_PUSH_LOGIN_EVENT_ID=2500
TZ_MPESA_USSD_PUSH_REQUEST_EVENT_ID=40009
TZ_MPESA_USSD_PUSH_REQUEST_COMMAND=customerLipa
TZ_MPESA_USSD_PUSH_BASE_URL=
TZ_MPESA_USSD_PUSH_LOGIN_PATH=
TZ_MPESA_USSD_PUSH_REQUEST_PATH=
```

## Test

- Clone this repository

- Install all dependencies

```sh
npm install
```

- Then run test

```sh
npm test
```

## Contribute

It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence

The MIT License (MIT)

Copyright (c) 2019 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
