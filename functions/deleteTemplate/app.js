
const AWS = require('aws-sdk');

const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const deleteTemplate = (idTemplate) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.TEMPLATE_TABLE,
      Key: { idTemplate },
      ConditionExpression: 'attribute_exists(idTemplate)'
    };
    documentClient.delete(params, (err, data) => {
      if (err)
        return reject(err);
      if (!data)
        return reject({ response: { status: 404, data: { message: 'idTemplate not found.' } } });
      resolve(data);
    });
  });
}

exports.handler = async (event) => {
  console.log('START =>', JSON.stringify(event));
  try {
    await deleteTemplate(event.pathParameters.idTemplate);
    return responseFactory({ response: { status: 204, data: {} } });
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  }
};