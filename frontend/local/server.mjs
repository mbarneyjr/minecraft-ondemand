import express from 'express';
import cookie from 'cookie';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';

import { handler } from '../index.mjs';
import { logger } from '../lib/logger/index.mjs';

const app = express();

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 50);
});
app.use(connectLivereload());
app.set('query parser', 'simple');
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ strict: false }));
app.disable('etag');

const port = 3000;

/** @type {import('aws-lambda').Context} */
const lambdaContext = {
  callbackWaitsForEmptyEventLoop: true,
  succeed: (result) => result,
  fail: (result) => result,
  done: (result) => result,
  functionVersion: '$LATEST',
  functionName: 'frontend',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/frontend',
  logStreamName: '2020/02/02/[$LATEST]abc123',
  clientContext: undefined,
  identity: undefined,
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:frontend',
  awsRequestId: 'abcd1234-ab12-ab12-ab12-abcdef123456',
  getRemainingTimeInMillis: () => 3000,
};

app.all('/*', async (req, res) => {
  /** @type {Record<string, string>} */
  const normalizedHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) normalizedHeaders[key] = Array.isArray(value) ? value.join(',') : value;
  }
  /** @type {Record<string, string>} */
  const normalizedQuerystringParameters = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (value) {
      if (typeof value === 'string') {
        normalizedQuerystringParameters[key] = value;
      } else if (Array.isArray(value)) {
        normalizedQuerystringParameters[key] = value.join(',');
      }
      // with app.set('query parser', 'simple'), req.query won't have nested objects
    }
  }

  /** @type {import('aws-lambda').APIGatewayProxyEventV2} */
  const lambdaEvent = {
    version: '2.0',
    routeKey: 'GET /{proxy+}',
    rawPath: req.path,
    cookies: req.headers.cookie
      ? Object.entries(cookie.parse(req.headers.cookie)).map(([key, value]) => `${key}=${value}`)
      : [],
    headers: normalizedHeaders,
    body: JSON.stringify(req.body),
    rawQueryString: `${new URLSearchParams(normalizedQuerystringParameters)}`,
    queryStringParameters: normalizedQuerystringParameters,
    isBase64Encoded: false,
    requestContext: {
      http: {
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        sourceIp: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
      accountId: '123123123123',
      apiId: 'apiId',
      domainName: 'localhost:3000',
      domainPrefix: 'domainPrefix',
      requestId: 'abc123',
      routeKey: 'GET /{proxy+}',
      stage: 'local',
      time: 'now',
      timeEpoch: 1,
    },
  };
  const lambdaResponse = await handler(lambdaEvent, lambdaContext);

  res
    .status(lambdaResponse.statusCode ?? 200)
    .set({
      ...lambdaResponse.headers,
      'set-cookie': lambdaResponse.cookies,
    })
    .send(
      lambdaResponse.body && lambdaResponse.isBase64Encoded
        ? Buffer.from(lambdaResponse.body, 'base64')
        : lambdaResponse.body,
    );
});

app.listen(port, () => {
  /* eslint-disable-next-line no-console */
  logger.info(`Listening on http://localhost:${port}`);
});
