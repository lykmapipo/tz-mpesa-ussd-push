'use strict';


/* dependencies */
const _ = require('lodash');
const { readFileSync } = require('fs');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const {
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  parseRequest,
  parseTransactionResult,
  buildRequest
} = include(__dirname, '..');


describe('tz mpesa ussd push', () => {
  it('should be from tz', () => {
    expect(country).to.exist;
    expect(country).to.be.equal('TZ');
  });

  it('should be from Vodacom', () => {
    expect(provider).to.exist;
    expect(provider).to.be.equal('Vodacom');
  });

  it('should be a mobile money method', () => {
    expect(method).to.exist;
    expect(method).to.be.equal('Mobile Money');
  });

  it('should be an mpesa channel', () => {
    expect(channel).to.exist;
    expect(channel).to.be.equal('MPESA');
  });

  it('should use ussd push mode', () => {
    expect(mode).to.exist;
    expect(mode).to.be.equal('USSD Push');
  });

  it('should use tzs currency', () => {
    expect(currency).to.exist;
    expect(currency).to.be.equal('TZS');
  });

  it('should parse generic request to json', (done) => {
    const xmlPath = `${__dirname}/fixtures/generic_request.xml`;
    const xml = readFileSync(xmlPath, 'UTF-8');
    parseRequest(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, request } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(request).to.exist;
      expect(request).to.be.an('object');
      done(error, payload);
    });
  });

  it('should parse transaction result to json', (done) => {
    const xmlPath = `${__dirname}/fixtures/transaction_result.xml`;
    const xml = readFileSync(xmlPath, 'UTF-8');
    parseTransactionResult(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, request } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(header).to.be.eql({ eventId: 1 });
      expect(request).to.exist;
      expect(request).to.be.an('object');
      expect(request).to.be.eql({
        resultType: undefined,
        resultCode: undefined,
        resultDesc: undefined,
        transactionStatus: 'USSDCallbackCancel',
        originatorConversationId: undefined,
        conversationId: undefined,
        transId: undefined,
        businessNumber: 888888,
        currency: 'TZS',
        amount: 1500,
        date: new Date('2017-12-04T16:01:47.000Z'),
        thirdPartyReference: 'E5FK3170',
        insightReference: '5F8648318CD95BC3E0531600980A264E'
      });
      done(error, payload);
    });
  });

  it('should build generic request to json', (done) => {
    const xmlPath = `${__dirname}/fixtures/generic_request.xml`;
    const xml = readFileSync(xmlPath, 'UTF-8');
    const payload = {
      header: { eventId: 2500, token: '96feae744a986aeee4433' },
      request: { username: '123000', password: '123@123' }
    };
    buildRequest(payload, (error, request) => {
      expect(error).to.not.exist;
      expect(request).to.exist;
      expect(_.kebabCase(request)).to.be.equal(_.kebabCase(xml));
      done(error, request);
    });
  });

});
