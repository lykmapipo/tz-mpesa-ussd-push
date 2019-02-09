'use strict';


/* dependencies */
const { readFileSync } = require('fs');
const _ = require('lodash');
const nock = require('nock');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { login } = include(__dirname, '..');


describe('tz mpesa ussd push - login', () => {
  const BASE_URL = 'https://ussd.vodacom.io';
  const LOGIN_PATH = '/transactions';
  const requestXml =
    readFileSync(`${__dirname}/fixtures/login_request.xml`, 'UTF-8');
  const responseXml =
    readFileSync(`${__dirname}/fixtures/login_response.xml`, 'UTF-8');

  before(() => {
    process.env.TZ_MPESA_USSD_PUSH_BASE_URL = BASE_URL;
    process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH = LOGIN_PATH;
  });

  beforeEach(() => nock.cleanAll());

  beforeEach(() => {
    nock(BASE_URL)
      .post(LOGIN_PATH, body => {
        expect(_.kebabCase(body)).to.be.equal(_.kebabCase(requestXml));
        return true;
      })
      .reply(200, responseXml);
  });

  it('should succeed with valid credentials', (done) => {
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

  it('should handle authentication failed');
  it('should handle invalid credentials');
  it('should handle session expired');

  after(() => nock.cleanAll());
  after(() => nock.enableNetConnect());
  after(() => {
    delete process.env.TZ_MPESA_USSD_PUSH_BASE_URL;
    delete process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH;
  });
});
