'use strict';


/* dependencies */
const _ = require('lodash');
const moment = require('moment');
const xml2js = require('xml2js');
const {
  parse: xmlToJson,
  build: jsonToXml
} = require('paywell-xml');


/* constants */
const DATE_FORMAT = 'YYYYMMDD HHmmss';
const REQUEST_HEADER_TAG = 'envelope.header';
const REQUEST_DATA_TAG = 'envelope.body.getGenericResult.request.dataItem';
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
    value = moment(value, DATE_FORMAT).toDate();
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
 * @function parseRequest
 * @name parseRequest
 * @description Parse and convert generic xml request to json
 * @param {String} xml valid xml payload
 * @param {Function} done callback to invoke on success or errorH
 * @return {Object|Error} parsed request or error
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { parseRequest } = require('@lykmapipo/tz-mpesa-ussd-push');
 * parseRequest(xml, (error, request) => { ... });
 * // => { header: ..., body: ...}
 */
const parseRequest = (xml, done) => {
  // prepare parse options
  const { processors } = xml2js;
  const { stripPrefix } = processors;
  const tagNameProcessors = [stripPrefix, _.camelCase];
  const options = { tagNameProcessors };

  // parse request xml to json
  xmlToJson(xml, options, (error, json) => {
    // back-off on error
    if (error) { return done(error); }

    // obtain request header
    const header = _.get(json, REQUEST_HEADER_TAG, {});

    // obtain and transform request data
    const items = _.get(json, REQUEST_DATA_TAG, []);
    const request = _.reduce(items, (accumulator, item) => {
      const value = {};
      const key = _.camelCase(item.name);
      value[key] = transformValue(item);
      return _.merge({}, accumulator, value);
    }, {});

    // TODO parse response?

    // return request
    return done(null, { header, request });
  });
};


/**
 * @function parseTransactionResult
 * @name parseTransactionResult
 * @description Parse and convert ussd push xml result to json
 * @param {String} xml valid xml payload
 * @param {Function} done callback to invoke on success or errorH
 * @return {Object|Error} parsed result or error
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @statuc
 * @example
 * const { parseTransactionResult } = require('@lykmapipo/tz-mpesa-ussd-push');
 * parseTransactionResult(xml, (error, request) => { ... });
 * // => { header: ..., body: ...}
 */
const parseTransactionResult = (xml, done) => parseRequest(xml, done);


/**
 * @function buildRequest
 * @name buildRequest
 * @description Build and convert given json payload to ussd push xml request
 * @param {Object} payload valid json payload
 * @param {Function} done callback to invoke on success or errorH
 * @return {String|Error} xml string request or error
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @static
 * @example
 * const { buildRequest } = require('@lykmapipo/tz-mpesa-ussd-push');
 * buildRequest(payload, (error, request) => { ... });
 * // => String
 */
const buildRequest = (payload, done) => {

  // prepare header params
  const { header: { token = '?', eventId } } = payload;

  // prepare request
  let { request } = payload;
  request = _.map(request, (value, key) => {
    const name =
      _.chain(key).snakeCase().split('_').startCase().join('').value();
    return {
      name: name,
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
  jsonToXml(_payload, done);
};

// const buildLoginRequest;
// const buildTransactionRequest;


/* expose */
module.exports = exports = {
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  parseRequest,
  parseTransactionResult,
  buildRequest
};
