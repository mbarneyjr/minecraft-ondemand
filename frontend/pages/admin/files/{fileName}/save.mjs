import { existsSync, writeFileSync } from 'fs';
import { decode, encode } from 'querystring';
import { config } from '../../../../lib/config/index.mjs';
import { logger } from '../../../../lib/logger/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';

/**
 * @param {string} body
 * @returns {unknown}
 */
function parseBody(body) {
  try {
    return JSON.parse(body);
  } catch (err) {
    return JSON.parse(JSON.stringify(decode(body)));
  }
}

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
const saveFileHandler = async (event, session) => {
  const fileName = event.pathParameters?.['*'] ?? '';
  const filePath = `${config.filesDirectory}/${fileName}`;
  if (!existsSync(filePath)) {
    logger.info('file does not exist', { filePath });
    return {
      statusCode: 404,
      session,
    };
  }
  if (!event.body) {
    logger.info('event body not given');
    return {
      statusCode: 400,
      session,
    };
  }
  const formData = parseBody(event.body);
  if (typeof formData !== 'object' || formData === null) {
    logger.info('event body is not an object');
    return {
      statusCode: 400,
      session,
    };
  }
  if (!('file' in formData)) {
    logger.info('event body does not contain `file`');
    return {
      statusCode: 400,
      session,
    };
  }
  if (typeof formData.file !== 'string') {
    logger.info('event body `file` is not a string', { type: typeof formData.file, formDataFile: formData.file });
    return {
      statusCode: 400,
      session,
    };
  }
  const sanitizedFile = formData.file.replace(/\r\n/g, '\n');
  writeFileSync(filePath, sanitizedFile);
  return {
    statusCode: 302,
    headers: {
      location: `/admin/files/${fileName}?${encode({ success: true })}`,
    },
    session,
  };
};

export default authMiddleware(saveFileHandler, { adminOnly: true });
