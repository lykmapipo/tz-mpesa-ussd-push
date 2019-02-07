'use strict';


/* dependencies */
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
  parseRequest
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
    parseRequest(xml, (error, request) => {
      expect(error).to.not.exist;
      expect(request).to.exist;
      const { header, body } = request;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(body).to.exist;
      expect(body).to.be.an('object');
      done(error, request);
    });
  });
});
