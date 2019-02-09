'use strict';


/* dependencies */
const { readFileSync } = require('fs');
const _ = require('lodash');
const nock = require('nock');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { login } = include(__dirname, '..');


/* helpers */
const readFile = path => {
  const FIXTURES_PATH = `${__dirname}/fixtures`;
  return readFileSync(`${FIXTURES_PATH}/${path}`, 'UTF-8');
};


describe('tz mpesa ussd push - login', () => {
  const BASE_URL = 'https://ussd.vodacom.io';
  const LOGIN_PATH = '/transactions';
  const REQUEST_PATH = '/transactions';
  const USERNAME = '123000';
  const PASSWORD = '123@123';
  const BUSINESS_NAME = 'MPESA';
  const BUSINESS_NUMBER = '338899';

  const requestXml = readFile('login_request.xml');
  const responseXml = readFile('login_response.xml');
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
  });

  beforeEach(() => nock.cleanAll());

  it('should succeed with valid credentials', done => {
    nock(BASE_URL).post(LOGIN_PATH, body => {
      expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
      return true;
    }).reply(200, responseXml);

    const credentials = { username: '123000', password: '123@123' };
    login(credentials, (error, response, body) => {
      expect(error).to.not.exist;
      expect(response).to.exist;
      expect(body).to.exist;
      expect(response).to.be.eql({
        header: { eventId: 2500 },
        event: {
          code: 3,
          description: 'Processed',
          detail: 'Processed',
          transactionId: '504830a4f038cb842960cc'
        },
        request: { username: 123000, password: '123@123' },
        response: { sessionId: '744a986aeee4433fdf1b2' }
      });
      expect(body).to.be.eql({
        transactionId: '504830a4f038cb842960cc',
        sessionId: '744a986aeee4433fdf1b2'
      });
      done(error, response);
    });
  });

  it('should handle authentication failed', done => {
    nock(BASE_URL).post(LOGIN_PATH, body => {
      expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
      return true;
    }).reply(200, authFailedXml);

    const credentials = { username: '123000', password: '123@123' };
    login(credentials, error => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Authentication Failed');
      expect(error.status).to.be.equal(401);
      done();
    });
  });

  it('should handle invalid credentials', done => {
    nock(BASE_URL).post(LOGIN_PATH, body => {
      expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
      return true;
    }).reply(200, failedLoginXml);

    const credentials = { username: '123000', password: '123@123' };
    login(credentials, error => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Invalid Credentials');
      expect(error.status).to.be.equal(401);
      done();
    });
  });

  it('should handle session expired', done => {
    nock(BASE_URL).post(LOGIN_PATH, body => {
      expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
      return true;
    }).reply(200, sessionExpiredXml);

    const credentials = { username: '123000', password: '123@123' };
    login(credentials, error => {
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
  });
});
