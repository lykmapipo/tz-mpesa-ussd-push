'use strict';


/* dependencies */
// const _ = require('lodash');


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


/* expose */
module.exports = exports = {
  country,
  provider,
  method,
  channel,
  mode,
  currency
};
