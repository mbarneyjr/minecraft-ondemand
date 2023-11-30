import authMiddleware from '../../../lib/middleware/auth/index.mjs';
import { startService, stopService } from '../../../lib/backend/service.mjs';

/** @type {import('../../../lib/router/index.mjs').RenderFunction} */
const updateServiceHandler = async (event, session) => {
  if (!event.body) {
    return {
      body: JSON.stringify({
        error: 'event body not given',
      }),
      statusCode: 400,
      session,
    };
  }
  const decodedBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
  const parsedBody = JSON.parse(decodedBody);
  if (parsedBody.action === 'start') {
    await startService();
  } else if (parsedBody.action === 'stop') {
    await stopService();
  } else {
    return {
      body: JSON.stringify({
        error: 'event body\'s `action` is not "start" or "stop"',
        sentBody: parsedBody,
      }),
      statusCode: 400,
      session,
    };
  }
  return {
    headers: {
      'content-type': 'application/json',
    },
    session,
  };
};

export default authMiddleware(updateServiceHandler, { adminOnly: true });
