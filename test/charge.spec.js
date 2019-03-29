'use strict';


/* dependencies */
const { readFileSync } = require('fs');
const _ = require('lodash');
const moment = require('moment');
const nock = require('nock');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { charge } = include(__dirname, '..');


/* helpers */
const readFile = path => {
  const FIXTURES_PATH = `${__dirname}/fixtures`;
  return readFileSync(`${FIXTURES_PATH}/${path}`, 'UTF-8');
};


describe('tz mpesa ussd push - charge', () => {
  const BASE_URL = 'https://ussd.vodacom.io';
  const LOGIN_PATH = '/logins';
  const REQUEST_PATH = '/transactions';
  const USERNAME = '123000';
  const PASSWORD = '123@123';
  const BUSINESS_NAME = 'MPESA';
  const BUSINESS_NUMBER = '338899';
  const CALLBACK_URL = 'https://api.example.com/webhooks/payments';
  const CA_FILE_PATH = `${__dirname}/fixtures/ssl/root.pem`;
  const CERT_FILE_PATH = `${__dirname}/fixtures/ssl/test.crt`;
  const KEY_FILE_PATH = `${__dirname}/fixtures/ssl/test.key`;


  const loginXml = readFile('login_response.xml');
  const requestXml = readFile('transaction_request.xml');
  const responseXml = readFile('transaction_response.xml');
  const authFailedXml = readFile('authentication_failed_response.xml');
  const failedLoginXml = readFile('login_failed_response.xml');
  const sessionExpiredXml = readFile('session_expired_response.xml');

  before(() => {
    process.env.TZ_MPESA_USSD_PUSH_BASE_URL = BASE_URL;
    process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH = LOGIN_PATH;
    process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH = REQUEST_PATH;
    process.env.TZ_MPESA_USSD_PUSH_USERNAME = USERNAME;
    process.env.TZ_MPESA_USSD_PUSH_PASSWORD = PASSWORD;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME = BUSINESS_NAME;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER = BUSINESS_NUMBER;
    process.env.TZ_MPESA_USSD_PUSH_CALLBACK_URL = CALLBACK_URL;
    process.env.TZ_MPESA_USSD_SSL_CA_FILE_PATH = CA_FILE_PATH;
    process.env.TZ_MPESA_USSD_SSL_CERT_FILE_PATH = CERT_FILE_PATH;
    process.env.TZ_MPESA_USSD_SSL_KEY_FILE_PATH = KEY_FILE_PATH;
  });

  beforeEach(() => nock.cleanAll());

  it('should succeed with valid charge', done => {
    nock(BASE_URL).post(LOGIN_PATH).reply(200, loginXml);

    nock(BASE_URL).post(REQUEST_PATH, body => {
      expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
      return true;
    }).reply(200, responseXml);

    const options = {
      msisdn: '255754001001',
      amount: 1500,
      reference: 'A5FK3170',
      date: moment('2019020804', 'YYYYMMDDHH').toDate()
    };
    charge(options, (error, response, body) => {
      expect(error).to.not.exist;
      expect(response).to.exist;
      expect(body).to.exist;
      expect(response).to.be.eql({
        header: { eventId: 40009 },
        event: {
          code: 3,
          description: 'Processed',
          detail: 'Processed',
          transactionId: 'e4245ff7a2154b59a2a5e778c2806712'
        },
        request: {
          customerMsisdn: 255754001001,
          businessName: 'MPESA',
          businessNumber: 338899,
          currency: 'TZS',
          date: moment('2019020804', 'YYYYMMDDHH').toDate(),
          amount: 1500,
          thirdPartyReference: 'A5FK3170',
          command: 'customerLipa',
          callBackChannel: 1,
          callbackDestination: 'https://api.example.com/webhooks/payments',
          username: 338899
        },
        response: {
          thirdPartyReference: 'A5FK3170',
          insightReference: '580FBEBAF2F9FF43E0540208206B0EEF',
          responseCode: 0
        }
      });
      expect(body).to.be.eql({
        sessionId: '744a986aeee4433fdf1b2',
        transactionId: 'e4245ff7a2154b59a2a5e778c2806712',
        reference: '580FBEBAF2F9FF43E0540208206B0EEF'
      });
      done(error, response);
    });
  });

  it('should handle authentication failed', done => {
    nock(BASE_URL).post(LOGIN_PATH).reply(200, loginXml);
    nock(BASE_URL).post(REQUEST_PATH).reply(200, authFailedXml);

    const options = {
      msisdn: '255754001001',
      amount: 1500,
      reference: 'A5FK3170'
    };
    charge(options, error => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Authentication Failed');
      expect(error.status).to.be.equal(401);
      done();
    });
  });

  it('should handle invalid charge', done => {
    nock(BASE_URL).post(LOGIN_PATH).reply(200, loginXml);
    nock(BASE_URL).post(REQUEST_PATH).reply(200, failedLoginXml);

    const options = {
      msisdn: '255754001001',
      amount: 1500,
      reference: 'A5FK3170'
    };
    charge(options, error => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Invalid Credentials');
      expect(error.status).to.be.equal(401);
      done();
    });
  });

  it('should handle session expired', done => {
    nock(BASE_URL).post(LOGIN_PATH).reply(200, loginXml);
    nock(BASE_URL).post(REQUEST_PATH).reply(200, sessionExpiredXml);

    const options = {
      msisdn: '255754001001',
      amount: 1500,
      reference: 'A5FK3170'
    };
    charge(options, error => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Session Expired');
      expect(error.status).to.be.equal(401);
      done();
    });
  });

  after(() => nock.cleanAll());
  after(() => nock.enableNetConnect());
  after(() => {
    delete process.env.TZ_MPESA_USSD_PUSH_BASE_URL;
    delete process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_USERNAME;
    delete process.env.TZ_MPESA_USSD_PUSH_PASSWORD;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER;
    delete process.env.TZ_MPESA_USSD_PUSH_CALLBACK_URL;
    delete process.env.TZ_MPESA_USSD_SSL_CA_FILE_PATH;
    delete process.env.TZ_MPESA_USSD_SSL_CERT_FILE_PATH;
    delete process.env.TZ_MPESA_USSD_SSL_KEY_FILE_PATH;
  });
});
