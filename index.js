'use strict';


/* dependencies */
const _ = require('lodash');
const moment = require('moment');
const xml2js = require('xml2js');
const request = require('request');
const bodyParser = require('body-parser');
const { waterfall } = require('async');
const { areNotEmpty, compact } = require('@lykmapipo/common');
const { getString } = require('@lykmapipo/env');
const { parse: xmlToJson, build: jsonToXml } = require('paywell-xml');


/* constants */
const AUTH_FAILED = 'Authentication Failed';
const SESSION_EXPIRED = 'Session Expired';
const INVALID_CREDENTIALS = 'Invalid Credentials';
const RESULT_DATE_FORMAT = 'YYYYMMDD HHmmss';
const REQUEST_DATE_FORMAT = 'YYYYMMDDHH';
const REQUEST_HEADER_TAG = 'envelope.header';
const REQUEST_DATA_TAG = 'envelope.body.getGenericResult.request.dataItem';
const RESPONSE_HEADER_TAG = 'envelope.header';
const RESPONSE_TAG = 'envelope.body.getGenericResultResponse.soapapiResult';
const RESPONSE_EVENT_DATA_TAG = `${RESPONSE_TAG}.eventInfo`;
const RESPONSE_REQUEST_DATA_TAG = `${RESPONSE_TAG}.request.dataItem`;
const RESPONSE_DATA_TAG = `${RESPONSE_TAG}.response.dataItem`;
const $ = {
  'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
  'xmlns:soap': 'http://www.4cgroup.co.za/soapauth',
  'xmlns:gen': 'http://www.4cgroup.co.za/genericsoap'
};


/**
 * @name country
 * @description Human readable country code of a payment processing entity.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const country = 'TZ';


/**
 * @name provider
 * @description Human readable name of a payment processing entity.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const provider = 'Vodacom';


/**
 * @name method
 * @description Human readable supported method of a payment.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const method = 'Mobile Money';


/**
 * @name channel
 * @description Human readable supported channel of a payment.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const channel = 'MPESA';


/**
 * @name mode
 * @description Human readable supported mode of a payment.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const mode = 'USSD Push';


/**
 * @name currency
 * @description Currency accepted for payment.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const currency = 'TZS';

/**
 * @function withDefaults
 * @name withDefaults
 * @description merge provided options with defaults.
 * @param {Object} [optns] provided options
 * @return {Object} merged options
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @static
 * @public
 * @example
 * const { withDefaults } = require('@lykmapipo/');
 * const optns = { username: ..., loginUrl: ..., requestUrl: ...};
 * withDefaults(optns) // => { username: ..., loginUrl: ..., requestUrl: ...};
 */
const withDefaults = optns => {
  // merge defaults
  let options = _.merge({}, {
    username: getString('TZ_MPESA_USSD_PUSH_USERNAME'),
    password: getString('TZ_MPESA_USSD_PUSH_PASSWORD'),
    businessName: getString('TZ_MPESA_USSD_PUSH_BUSINESS_NAME'),
    businessNumber: getString('TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER'),
    loginEventId: getString('TZ_MPESA_USSD_PUSH_LOGIN_EVENT_ID', '2500'),
    requestEventId: getString('TZ_MPESA_USSD_PUSH_REQUEST_EVENT_ID',
      '40009'),
    requestCommand: getString('TZ_MPESA_USSD_PUSH_REQUEST_COMMAND',
      'customerLipa'),
    baseUrl: getString('TZ_MPESA_USSD_PUSH_BASE_URL'),
    loginPath: getString('TZ_MPESA_USSD_PUSH_LOGIN_PATH'),
    requestPath: getString('TZ_MPESA_USSD_PUSH_REQUEST_PATH'),
    callbackUrl: getString('TZ_MPESA_USSD_PUSH_CALLBACK_URL'),
    currency: currency
  }, optns);

  // ensure login url
  options.loginUrl =
    (options.loginUrl || `${options.baseUrl}${options.loginPath}`);

  // ensure request url
  options.requestUrl =
    (options.requestUrl || `${options.baseUrl}${options.requestPath}`);

  // compact and return
  options = compact(options);
  return options;
};

/**
 * @function transformValue
 * @name transformValue
 * @description Transform data item value to js object
 * @param {Object} item data item
 * @return {Object} transformed value
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const { transformValue } = require('@lykmapipo/tz-mpesa-ussd-push');
 * const item = {name: 'eventId', value: 1, type: String }
 * transformValue(item); // => '1'
 */
const transformValue = item => {
  // ensure item
  let { name, type, value } = _.merge({}, { value: undefined }, item);

  // transform date
  if (name === 'Date' && value) {
    value = moment(value, RESULT_DATE_FORMAT).toDate();
    return value;
  }

  // transform string
  if (type === 'String' && value) {
    value = value === 'null' ? undefined : value;
    return value;
  }

  // always return value
  return value;
};


/**
 * @function serialize
 * @name serialize
 * @description Build and convert given json payload to ussd push xml request
 * @param {Object} payload valid json payload
 * @param {Function} done callback to invoke on success or error
 * @return {String|Error} xml string request or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { serialize } = require('@lykmapipo/tz-mpesa-ussd-push');
 * serialize(payload, (error, request) => { ... });
 * // => String
 */
const serialize = (payload, done) => {
  // prepare header params
  const { header: { token = '?', eventId } } = payload;

  // prepare request
  let { request } = payload;
  request = _.map(request, (value, key) => {
    return {
      name: key,
      type: 'String',
      value: value
    };
  });

  // prepare request payload
  const _payload = {
    'soapenv:Envelope': {
      $: $,
      'soapenv:Header': {
        'soap:Token': token,
        'soap:EventID': eventId
      },
      'soapenv:Body': {
        'gen:getGenericResult': {
          'Request': {
            'dataItem': request
          }
        }
      }
    }
  };

  // convert to xml and return
  return jsonToXml(_payload, done);
};


/**
 * @function serializeLogin
 * @name serializeLogin
 * @description Build and convert provided credentials to ussd push login
 * request xml payload.
 * @param {Object} options valid login credentials
 * @param {String} options.username valid login username
 * @param {String} options.password valid login password
 * @param {Function} done callback to invoke on success or error
 * @return {String|Error} valid xml string for login request or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { serializeLogin } = require('@lykmapipo/tz-mpesa-ussd-push');
 * serializeLogin(payload, (error, request) => { ... });
 * // => String
 */
const serializeLogin = (options, done) => {
  // ensure credentials
  const credentials = withDefaults(options);

  // ensure api login url
  const { loginUrl } = credentials;
  if (_.isEmpty(loginUrl)) {
    let error = new Error('Missing API Login URL');
    error.status = 400;
    error.data = credentials;
    return done(error);
  }

  // ensure username and password
  const { username, password, loginEventId } = credentials;
  const isValid = areNotEmpty(username, password, loginEventId);

  // back-off if invalid credentials
  if (!isValid) {
    let error = new Error('Invalid Login Credentials');
    error.status = 400;
    error.data = credentials;
    return done(error);
  }

  // prepare ussd push login payload
  const payload = {
    header: { token: '?', eventId: loginEventId },
    request: { 'Username': username, 'Password': password }
  };

  // serialize login payload to xml
  return serialize(payload, done);
};


/**
 * @function serializeTransaction
 * @name serializeTransaction
 * @description Build and convert provided transaction to ussd push transaction
 * request xml payload.
 * @param {Object} options valid transaction details
 * @param {Function} done callback to invoke on success or error
 * @return {String|Error} valid xml string for transaction request or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { serializeTransaction } = require('@lykmapipo/tz-mpesa-ussd-push');
 * serializeTransaction(payload, (error, request) => { ... });
 * // => String
 */
const serializeTransaction = (options, done) => {
  // ensure transaction
  const transaction = withDefaults(options);

  // ensure api request url
  const { requestUrl } = transaction;
  if (_.isEmpty(requestUrl)) {
    let error = new Error('Missing API Request URL');
    error.status = 400;
    error.data = transaction;
    return done(error);
  }

  // obtain transaction details
  const {
    username,
    sessionId,
    msisdn,
    businessName,
    businessNumber,
    currency,
    date = new Date(),
    amount,
    reference,
    callbackUrl,
    requestEventId,
    requestCommand
  } = transaction;

  // ensure valid transaction details
  const isValid = (
    (amount > 0) &&
    areNotEmpty(username, sessionId, msisdn, currency) &&
    areNotEmpty(requestEventId, requestCommand) &&
    areNotEmpty(businessName, businessNumber, reference, callbackUrl)
  );

  // back-off if invalid transaction
  if (!isValid) {
    let error = new Error('Invalid Transaction Details');
    error.status = 400;
    error.data = transaction;
    return done(error);
  }

  // prepare ussd push transaction request payload
  const payload = {
    header: { token: sessionId, eventId: requestEventId },
    request: {
      'CustomerMSISDN': msisdn,
      'BusinessName': businessName,
      'BusinessNumber': businessNumber,
      'Currency': currency,
      'Date': moment(date).format(REQUEST_DATE_FORMAT),
      'Amount': amount,
      'ThirdPartyReference': reference,
      'Command': requestCommand,
      'CallBackChannel': 1,
      'CallbackDestination': callbackUrl,
      'Username': businessNumber
    }
  };

  // serialize ussd push transaction request payload to xml
  return serialize(payload, done);
};


/**
 * @function deserialize
 * @name deserialize
 * @description Parse and convert generic xml request to json
 * @param {String} xml valid xml payload
 * @param {Function} done callback to invoke on success or error
 * @return {Object|Error} parsed request or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { deserialize } = require('@lykmapipo/tz-mpesa-ussd-push');
 * deserialize(xml, (error, request) => { ... });
 * // => { header: ..., event: ..., request: ..., response: ...}
 */
const deserialize = (xml, done) => {
  // prepare parse options
  const { processors } = xml2js;
  const { stripPrefix } = processors;
  const tagNameProcessors = [stripPrefix, _.camelCase];
  const options = { tagNameProcessors };

  // parse request xml to json
  xmlToJson(xml, options, (error, json) => {
    // back-off on error
    if (error) { return done(error); }

    // obtain request header and normalize
    const header = (
      _.get(json, REQUEST_HEADER_TAG) ||
      _.get(json, RESPONSE_HEADER_TAG) || {}
    );
    header.eventId = (
      _.get(header, 'eventId') ||
      _.get(header, 'eventid._') ||
      _.get(header, 'eventid')
    );
    delete header.eventid;

    // obtain request event
    const event = _.get(json, RESPONSE_EVENT_DATA_TAG, {});

    // deserialize items to js objects
    const itemize = items => _.reduce(items, (accumulator, item) => {
      const value = {};
      const key = _.camelCase(item.name);
      value[key] = transformValue(item);
      return _.merge({}, accumulator, value);
    }, {});

    // obtain and transform request data
    let request = [].concat((
      _.get(json, REQUEST_DATA_TAG) ||
      _.get(json, RESPONSE_REQUEST_DATA_TAG) || []
    ));
    request = itemize(request);

    // obtain and transform response data
    let response = [].concat(_.get(json, RESPONSE_DATA_TAG, []));
    response = itemize(response);

    // handle authentication failed
    const authFailed = (event && event.detail === AUTH_FAILED);
    if (authFailed) {
      let error = new Error(AUTH_FAILED);
      error.status = 401;
      return done(error);
    }

    // handle session expired
    const sessionExpired = (event && event.detail === SESSION_EXPIRED);
    if (sessionExpired) {
      let error = new Error(SESSION_EXPIRED);
      error.status = 401;
      return done(error);
    }

    // handle login failed
    const invalidCredentials =
      (response && response.sessionId === INVALID_CREDENTIALS);
    if (invalidCredentials) {
      let error = new Error(INVALID_CREDENTIALS);
      error.status = 401;
      return done(error);
    }

    // return request
    return done(null, { header, event, request, response });
  });
};


/**
 * @function deserializeLogin
 * @name deserializeLogin
 * @description Parse and convert ussd push login xml result to json
 * @param {String} xml valid login xml payload
 * @param {Function} done callback to invoke on success or error
 * @return {Object|Error} parsed result or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { deserializeLogin } = require('@lykmapipo/tz-mpesa-ussd-push');
 * deserializeLogin(xml, (error, request) => { ... });
 * // => { header: ..., event: ..., request: ..., response: ...}
 */
const deserializeLogin = (xml, done) => deserialize(xml, done);


/**
 * @function deserializeTransaction
 * @name deserializeTransaction
 * @description Parse and convert ussd push transaction response xml result
 * to json
 * @param {String} xml valid transaction response xml payload
 * @param {Function} done callback to invoke on success or error
 * @return {Object|Error} parsed result or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { deserializeTransaction } = require('@lykmapipo/tz-mpesa-ussd-push');
 * deserializeTransaction(xml, (error, request) => { ... });
 * // => { header: ..., request: ..., response: ...}
 */
const deserializeTransaction = (xml, done) => deserialize(xml, done);


/**
 * @function deserializeResult
 * @name deserializeResult
 * @description Parse and convert ussd push transaction xml result to json
 * @param {String} xml valid transaction xml payload
 * @param {Function} done callback to invoke on success or error
 * @return {Object|Error} parsed result or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { deserializeResult } = require('@lykmapipo/tz-mpesa-ussd-push');
 * deserializeResult(xml, (error, request) => { ... });
 * // => { header: ..., request: ...}
 */
const deserializeResult = (xml, done) => deserialize(xml, done);


/**
 * @function login
 * @name login
 * @description Issue login request to ussd push API server
 * @param {Object} options valid login credentials
 * @param {String} options.username valid login username
 * @param {String} options.password valid login password
 * @param {Function} done callback to invoke on success or error
 * @return {String|Error} valid login response or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { login } = require('@lykmapipo/tz-mpesa-ussd-push');
 * const credentials = { username: ..., password: ...};
 * login(credentials, (error, response) => { ... });
 * // => { sessionId: ...}
 */
const login = (options, done) => {
  // obtain login url
  const { loginUrl } = withDefaults(options);

  // prepare login xml payload
  const prepareLoginPayload = next => serializeLogin(options, next);

  // issue login request
  const issueLoginRequest = (payload, next) => {
    // prepare login request options
    const options = {
      url: loginUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      body: payload
    };

    // send login request
    return request(options, (error, response, body) => next(error, body));
  };

  // parse login response
  const parseLoginResponse = (response, next) => {
    return deserializeLogin(response, (error, payload) => {
      // back off on error
      if (error) { return next(error); }

      // prepare simplified body
      const transactionId = _.get(payload, 'event.transactionId');
      const sessionId = _.get(payload, 'response.sessionId');
      const body = { transactionId, sessionId };

      // continue
      return next(error, payload, body);
    });
  };

  // do login
  return waterfall([
    prepareLoginPayload,
    issueLoginRequest,
    parseLoginResponse
  ], done);
};


/**
 * @function charge
 * @name charge
 * @description Initiate ussd push payment request customer via ussd push API
 * server
 * @param {Object} options valid transaction options
 * @param {String} options.msisdn valid customer mobile phone number
 * @param {Number} options.amount valid transaction amount
 * @param {String} options.reference valid transaction reference number
 * @param {Function} done callback to invoke on success or error
 * @return {String|Error} valid charge response or error
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { charge } = require('@lykmapipo/tz-mpesa-ussd-push');
 * const options = { msisdn: '255754001001', amount: 1500, reference: 'A5FK3170' }
 * charge(options, (error, response) => { ... });
 * // => { reference: ..., transactionId: ....}
 */
const charge = (options, done) => {
  // obtain request url
  const { requestUrl } = withDefaults(options);

  // issue login request
  const issueLoginRequest = next => login(options, next);

  // prepare request xml payload
  const prepareChargeRequest = (response, body, next) => {
    // prepare transaction
    const { sessionId } = body;
    const transaction = _.merge({}, { sessionId }, options);
    serializeTransaction(transaction, next);
  };

  // issue request
  const issueChargeRequest = (payload, next) => {
    // prepare charge request options
    const options = {
      url: requestUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      body: payload
    };

    // send charge request
    return request(options, (error, response, body) => next(error, body));
  };

  // parse charge response
  const parseChargeResponse = (response, next) => {
    return deserializeTransaction(response, (error, payload) => {
      // back off on error
      if (error) { return next(error); }

      // prepare simplified body
      const transactionId = _.get(payload, 'event.transactionId');
      const reference = _.get(payload, 'response.insightReference');
      const body = { transactionId, reference };

      // continue
      return next(error, payload, body);
    });
  };

  // do charge
  return waterfall([
    issueLoginRequest,
    prepareChargeRequest,
    issueChargeRequest,
    parseChargeResponse
  ], done);
};


/**
 * @function parseHttpBody
 * @name parseHttpBody
 * @description Middleware chain to parse ussd push result
 * @param {Object} options valid text body parse options
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { parseHttpBody } = require('@lykmapipo/tz-mpesa-ussd-push');
 * const app = require('@lykmapipo/express-common');
 *
 * app.all('/v1/webhooks/tz/mpesa/ussdpush', parseHttpBody(), (request, response, next) => { ... });
 *
 */
const parseHttpBody = (optns) => {
  // merge options
  const options = _.merge({}, {
    type: '*/*',
    limit: getString('BODY_PARSER_LIMIT', '2mb')
  }, optns);

  // prepare text body parse
  const parseTextBody = bodyParser.text(options);

  // prepare xml deserializer
  const parseUssdPushBody = (request, response, next) => {
    // parse only if text body
    if (request.body && _.isString(request.body)) {
      // try deserializing
      try {
        // keep raw body
        const raw = _.clone(request.body);
        request.raw = raw;

        // deserialize ussd push result
        return deserializeResult(raw, (error, result) => {
          request.body = result ? result : raw;
          return next();
        });
      }

      // back-off on deserializing error
      catch (error) {
        return next(error);
      }
    }

    // always continue
    return next();
  };

  // return middleware chain
  return [parseTextBody, parseUssdPushBody];
};


/* expose */
module.exports = exports = {
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  withDefaults,
  serialize,
  serializeLogin,
  serializeTransaction,
  deserialize,
  deserializeLogin,
  deserializeTransaction,
  deserializeResult,
  login,
  charge,
  parseHttpBody
};
