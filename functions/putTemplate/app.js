const AWS = require('aws-sdk');


const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const updateTemplate = (idTemplate, html) => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.TEMPLATE_TABLE,
      Key: { idTemplate },
      UpdateExpression: 'set html = :html',
      ExpressionAttributeValues: { ':html': html },
      ConditionExpression: 'attribute_exists(idTemplate)',
      ReturnValues: 'ALL_NEW'
    };
    documentClient.update(params, (err, data) => {
      if (err)
        return reject(err);
      if (!data)
        return reject({ response: { status: 404, data: { message: 'idTemplate not found.' } } })
      resolve(data.Attributes);
    });
  });
}

exports.handler = async (event) => {
  console.log('START', JSON.stringify(event));
  try {
    const { pathParameters: { idTemplate }, body: html } = event;

    if (!html)
      return responseFactory({ response: { status: 400, data: { message: 'Invalid request body. Missing HTML data.' } } });

    const res = await updateTemplate(idTemplate, html);
    return responseFactory(null, res);
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  }
};
