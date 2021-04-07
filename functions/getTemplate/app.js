
const AWS = require('aws-sdk');

const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const getTemplate = (idTemplate) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.TEMPLATE_TABLE,
      Key: {
        idTemplate
      }
    };
    documentClient.get(params, (err, data) => {
      if (err)
        return reject(err);
      if (!data.Item)
        return reject({ response: { status: 404, data: { message: 'idTemplate not found.' } } });
      resolve(data.Item);
    });
  });
}

exports.handler = async (event) => {
  console.log('START =>', JSON.stringify(event));
  try {
    const res = await getTemplate(event.pathParameters.idTemplate);
    return responseFactory(null, res);
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  }
};