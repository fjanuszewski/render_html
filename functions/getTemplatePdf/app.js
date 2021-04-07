
const AWS = require('aws-sdk');
const axios = require('axios');

const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const getTemplate = documentClient => (idTemplate) => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.TEMPLATE_TABLE,
      Key: { idTemplate }
    };
    documentClient.get(params, (err, res) => {
      if (err)
        return reject(err);
      resolve(res.Item);
    });
  });
}

const getPdfUrlSigned = (requestContext, html, expiration = 300, pageFormat = 'A4', margin = 1, fileName = undefined) => {
  return new Promise((resolve, reject) => {
    const params = {
      method: 'post',
      url: `${process.env.API}render`,
      headers: {
        Authorization: `Bearer ${requestContext.authorizer.token}`
      },
      data: {
        html,
        expiration: parseInt(expiration),
        pageFormat,
        margin: parseInt(margin),
        fileName
      }
    };
    console.log('params', params);
    axios(params)
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}

exports.handler = async (event) => {
  console.log('START =>', JSON.stringify(event));
  const documentClient = new AWS.DynamoDB.DocumentClient();

  try {
    // defaults to object if there is none params to avoid destructuring failing
    const queryStringParameters = event.queryStringParameters ? event.queryStringParameters : {};
    const { expiration = undefined, pageFormat = undefined, margin = undefined, fileName = undefined } = queryStringParameters;

    const template = await getTemplate(documentClient)(event.pathParameters.idTemplate);
    const url = await getPdfUrlSigned(event.requestContext, template.html, expiration, pageFormat, margin, fileName);
    return responseFactory(null, url);
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  }
};