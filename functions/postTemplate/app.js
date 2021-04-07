const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const createTemplate = (idTemplate, html) => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.TEMPLATE_TABLE,
      Item: {
        idTemplate,
        html
      }
    };
    documentClient.put(params, (err, data) => {
      if (err)
        return reject(err);
      resolve(params.Item);
    });
  });
}

exports.handler = async (event) => {
  console.log('START', JSON.stringify(event));
  try {
    const { queryStringParameters: { idTemplate }, body: html } = event;

    if (!html)
      return responseFactory({ response: { status: 400, data: { message: 'Invalid request body. Missing HTML data.' }}});

    const res = await createTemplate(idTemplate, html);
    return responseFactory(null, res);
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  }
};
