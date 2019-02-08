'use strict';


/* dependencies */
const _ = require('lodash');
const moment = require('moment');
const xml2js = require('xml2js');
const { areNotEmpty } = require('@lykmapipo/common');
const { getString } = require('@lykmapipo/env');
const {
  parse: xmlToJson,
  build: jsonToXml
} = require('paywell-xml');


/* constants */
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
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const country = 'TZ';


/**
 * @name provider
 * @description Human readable name of a payment processing entity.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const provider = 'Vodacom';


/**
 * @name method
 * @description Human readable supported method of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const method = 'Mobile Money';


/**
 * @name channel
 * @description Human readable supported channel of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const channel = 'MPESA';


/**
 * @name mode
 * @description Human readable supported mode of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const mode = 'USSD Push';


/**
 * @name currency
 * @description Currency accepted for payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 */
const currency = 'TZS';


/**
 * @function transformValue
 * @name transformValue
 * @description Transform data item value to js object
 * @param {Object} item data item
 * @return {Object} transformed value
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
  const credentials = _.merge({}, options);

  // ensure username and password
  const {
    username = getString('TZ_MPESA_USSD_PUSH_USERNAME'),
      password = getString('TZ_MPESA_USSD_PUSH_PASSWORD')
  } = credentials;
  const isValid = !_.isEmpty(username) && !_.isEmpty(password);

  // back-off if invalid credentials
  if (!isValid) {
    let error = new Error('Invalid Login Credentials');
    error.status = 400;
    return done(error);
  }

  // prepare ussd push login payload
  const token = '?';
  const eventId = 2500;
  const payload = {
    header: { token, eventId },
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
  const transaction = _.merge({}, options);

  // obtain transaction details
  const {
    username = getString('TZ_MPESA_USSD_PUSH_USERNAME'),
      token,
      msisdn,
      businessName = getString('TZ_MPESA_USSD_PUSH_BUSINESS_NAME'),
      businessNumber = getString('TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER'),
      currency = 'TZS',
      date = new Date(),
      amount,
      reference,
      callback = getString('TZ_MPESA_USSD_PUSH_CALLBACK_URL')
  } = transaction;

  // ensure valid transaction details
  const isValid = (
    (amount > 0) &&
    areNotEmpty(username, token, msisdn, currency) &&
    areNotEmpty(businessName, businessNumber, reference, callback)
  );

  // back-off if invalid transaction
  if (!isValid) {
    let error = new Error('Invalid Transaction Details');
    error.status = 400;
    return done(error);
  }

  // prepare ussd push transaction request payload
  const eventId = 40009;
  const payload = {
    header: { token, eventId },
    request: {
      'CustomerMSISDN': msisdn,
      'BusinessName': businessName,
      'BusinessNumber': businessNumber,
      'Currency': currency,
      'Date': moment(date).format(REQUEST_DATE_FORMAT),
      'Amount': amount,
      'ThirdPartyReference': reference,
      'Command': 'customerLipa',
      'CallBackChannel': 1,
      'CallbackDestination': callback,
      'Username': username
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
 * @function parseTransactionResult
 * @name parseTransactionResult
 * @description Parse and convert ussd push transaction xml result to json
 * @param {String} xml valid transaction xml payload
 * @param {Function} done callback to invoke on success or error
 * @return {Object|Error} parsed result or error
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { parseTransactionResult } = require('@lykmapipo/tz-mpesa-ussd-push');
 * parseTransactionResult(xml, (error, request) => { ... });
 * // => { header: ..., request: ...}
 */
const parseTransactionResult = (xml, done) => deserialize(xml, done);


/* expose */
module.exports = exports = {
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  serialize,
  serializeLogin,
  serializeTransaction,
  deserialize,
  deserializeLogin,
  deserializeTransaction,
  parseTransactionResult
};
