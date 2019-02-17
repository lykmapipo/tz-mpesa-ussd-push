'use strict';


/* dependencies */
const { readFileSync } = require('fs');
// const _ = require('lodash');
const moment = require('moment');
const request = require('supertest');
const app = require('@lykmapipo/express-common');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { parseHttpBody } = include(__dirname, '..');


/* helpers */
const readFile = path => {
  const FIXTURES_PATH = `${__dirname}/fixtures`;
  return readFileSync(`${FIXTURES_PATH}/${path}`, 'UTF-8');
};


describe('tz mpesa ussd push - parse body', () => {
  const BASE_URL = 'https://ussd.vodacom.io';
  const LOGIN_PATH = '/transactions';
  const REQUEST_PATH = '/transactions';
  const USERNAME = '123000';
  const PASSWORD = '123@123';
  const BUSINESS_NAME = 'MPESA';
  const BUSINESS_NUMBER = '338899';

  const resultXml = readFile('transaction_result.xml');

  before(() => {
    process.env.TZ_MPESA_USSD_PUSH_BASE_URL = BASE_URL;
    process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH = LOGIN_PATH;
    process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH = REQUEST_PATH;
    process.env.TZ_MPESA_USSD_PUSH_USERNAME = USERNAME;
    process.env.TZ_MPESA_USSD_PUSH_PASSWORD = PASSWORD;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME = BUSINESS_NAME;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER = BUSINESS_NUMBER;
  });

  it('should parse ussd push result', done => {

    app.all('/webhook', parseHttpBody(), (request, response) => {
      response.status(200);
      response.json(request.body);
    });

    request(app)
      .post('/webhook')
      .set('Accept', 'text/xml')
      .set('Content-Type', 'text/xml')
      .send(resultXml)
      .expect(200)
      .end((error, response) => {
        expect(error).to.not.exist;
        expect(response.body).to.exist;
        const { header, request } = response.body;
        expect(header).to.exist;
        expect(header).to.be.an('object');
        expect(header).to.be.eql({ eventId: 1 });
        expect(request).to.exist;
        expect(request).to.be.an('object');
        expect(response.body).to.be.eql({
          header: { eventId: 1 },
          event: {},
          request: {
            transactionStatus: 'USSDCallbackCancel',
            businessNumber: 888888,
            currency: 'TZS',
            amount: 1500,
            date: moment('20190208 190147', 'YYYYMMDD HHmmss').toDate()
              .toISOString(),
            thirdPartyReference: 'E5FK3170',
            insightReference: '580FBEBAF2F9FF43E0540208206B0EEF'
          },
          response: {}
        });
        done(error, response);
      });
  });

  after(() => {
    delete process.env.TZ_MPESA_USSD_PUSH_BASE_URL;
    delete process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_USERNAME;
    delete process.env.TZ_MPESA_USSD_PUSH_PASSWORD;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER;
  });
});
