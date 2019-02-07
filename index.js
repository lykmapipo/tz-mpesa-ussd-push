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


/**
 * @name country
 * @description Human readable country code of a payment processing entity.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 */
const country = 'TZ';


/**
 * @name provider
 * @description Human readable name of a payment processing entity.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 */
const provider = 'Vodacom';


/**
 * @name method
 * @description Human readable supported method of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 */
const method = 'Mobile Money';


/**
 * @name channel
 * @description Human readable supported channel of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 */
const channel = 'MPESA';


/**
 * @name mode
 * @description Human readable supported mode of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
 */
const mode = 'USSD Push';


/**
 * @name currency
 * @description Currency accepted for payment.
 * @since 0.1.0
 * @version 0.1.0
 * @public
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
 * transformValue(item);
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
 * @example
 * const { parseRequest } = require('@lykmapipo/tz-mpesa-ussd-push');
 * parseRequest(xml, (error, request) => { ... });
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

    // obtain request data
    const items = _.get(json, REQUEST_DATA_TAG, []);
    const body = _.reduce(items, (accumulator, item) => {
      const value = {};
      const key = _.camelCase(item.name);
      value[key] = transformValue(item);
      return _.merge({}, accumulator, value);
    }, {});

    // return request
    return done(null, { header, body });
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
 * @example
 * const { parseTransactionResult } = require('@lykmapipo/tz-mpesa-ussd-push');
 * parseTransactionResult(xml, (error, request) => { ... });
 */
const parseTransactionResult = (xml, done) => parseRequest(xml, done);


const buildRequest = (json, done) => {
  // prepare build options
  jsonToXml(json, done);
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
