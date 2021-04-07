'use strict';

require('dotenv').config();
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk-mock');
const nock = require('nock');

const app = require('../app.js');

describe('Get Template as PDF', function () {

  it('it should get a response', async function () {
    this.timeout(10000);
    process.env.API = 'https://test.com/';
    process.env.TEMPLATE_TABLE = 'test';

    const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/mocks/event.json')).toString());
    const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/mocks/response.json')).toString());
    const response_pdf = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/mocks/response_pdf.json')).toString());
    const url = response_pdf.url;

    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, { Item: response });
    });

    nock(`${process.env.API}render`).post('').reply(200, response_pdf);

    try {
      const result = await app.handler(event, context);
      const body = JSON.parse(result.body);
      console.log('body asdasd', body);
      expect(result.statusCode).to.be.equals(200);
      expect(body).to.have.property('url');
      expect(body.url).to.equals(url);
    } catch (err) {
      console.error(err)
      throw err
    }
  });
});
