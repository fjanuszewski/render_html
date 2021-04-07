
const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const uuid = require('uuid');

const responseFactory = (error, result) => ({
  statusCode: (error) ? error.response.status : 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: (error) ? JSON.stringify(error.response.data) : JSON.stringify(result)
});

const uploadFile = S3 => (filename, buffer) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.BUCKET,
      Key: filename,
      Body: buffer,
      ACL: 'public-read'
    };
    S3.upload(params, (err, res) => {
      if (err)
        return reject(err);
      resolve(res);
    });
  });
}

const getUrlFile = S3 => (filename, expiration) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.BUCKET,
      Key: filename,
      Expires: expiration
    };
    S3.getSignedUrl('getObject', params, (err, res) => {
      if (err)
        return reject(err);
      resolve(res);
    });
  });
}

const launchBrowser = async () => await chromium.puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath,
  headless: true
});

const getBufferFromHtml = async (browser, fileName, body) => {
  const { html, margin: marginNumber, pageFormat: format } = body;
  const margin = `${marginNumber}cm`;
  const output = `/tmp/${fileName}`;

  const pdfOptions = {
    path: output,
    format,
    printBackground: true,
    margin: { top: margin, right: margin, bottom: margin, left: margin },
    displayHeaderFooter: false
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle2' });
  return await page.pdf(pdfOptions);
}

exports.handler = async (event) => {
  console.log('START =>', JSON.stringify(event));
  const browser = await launchBrowser();
  const S3 = new AWS.S3();

  try {
    const body = JSON.parse(event.body);
    const fileName = body.fileName || uuid.v4();
    const buffer = await getBufferFromHtml(browser, fileName, body);

    await uploadFile(S3)(fileName, buffer);
    const url = await getUrlFile(S3)(fileName, body.expiration);

    return responseFactory(null, { url });
  } catch (error) {
    console.log(error);
    return responseFactory({
      response: error.response || { status: 500, data: { message: 'Internal server error.' } }
    });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};