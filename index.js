'use strict';


/* dependencies */
const _ = require('lodash');
const xml2js = require('xml2js');
const {
  parse: xmlToJson,
  build: jsonToXml
} = require('paywell-xml');


/* constants */
const REQUEST_HEADER_TAG = 'envelope.header';
const REQUEST_DATA_TAG = 'envelope.body.getGenericResult.request.dataItem';


/**
 * @name country
 * @description Human readable country code of a payment processing entity.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const country = 'TZ';


/**
 * @name provider
 * @description Human readable name of a payment processing entity.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const provider = 'Vodacom';


/**
 * @name method
 * @description Human readable supported method of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const method = 'Mobile Money';


/**
 * @name channel
 * @description Human readable supported channel of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const channel = 'MPESA';


/**
 * @name mode
 * @description Human readable supported mode of a payment.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const mode = 'USSD Push';


/**
 * @name currency
 * @description Currency accepted for payment.
 * @since 0.1.0
 * @version 0.1.0
 * @instance
 */
const currency = 'TZS';


/**
 * @function parseRequest
 * @name parseRequest
 * @description Parse and convert generic xml request to json
 * @param {String} xml valid xml payload
 * @param {Function} done callback to invoke on success or errorH
 * @return {Object|Error} parsed request or error
 * @since 0.1.0
 * @version 0.1.0
 * @instance
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
      value[_.camelCase(item.name)] = item.value;
      return _.merge({}, accumulator, value);
    }, {});

    // return request
    return done(null, { header, body });
  });
};


const buildRequest = (json, done) => {
  // prepare build options
  jsonToXml(json, done);
};


/* expose */
module.exports = exports = {
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  parseRequest,
  buildRequest
};
