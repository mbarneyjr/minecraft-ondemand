import { existsSync, writeFileSync } from 'fs';
import { decode, encode } from 'querystring';
import { config } from '../../../../lib/config/index.mjs';
import { logger } from '../../../../lib/logger/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';
import { parseFormBody } from '../../../../lib/form/parse.mjs';

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
  const parsedFormBody = await parseFormBody(event.body, {
    contentType: event.headers['content-type'] || event.headers['Content-Type'],
  });
  logger.debug('parsed form body', { parsedFormBody });

  const formData = parseBody(event.body);
  if (typeof formData !== 'object' || formData === null) {
    logger.info('event body is not an object');
    return {
      statusCode: 400,
      session,
    };
  }

  if ('file' in parsedFormBody) {
    if (parsedFormBody.file.type !== 'file') {
      logger.error('event body\'s `file` is not a "file" type');
      return {
        statusCode: 500,
        session,
      };
    }
    const binaryString = [...parsedFormBody.file.value.content].map((b) => b.toString(2).padStart(8, '0')).join('');
    logger.debug('binary string', { binaryString });
    writeFileSync(filePath, parsedFormBody.file.value.content, {
      encoding: parsedFormBody.file.value.encoding,
    });
  } else if ('file-source' in parsedFormBody) {
    if (parsedFormBody['file-source'].type !== 'field') {
      logger.error('event body\'s `file-source` is not a "field" type');
      return {
        statusCode: 500,
        session,
      };
    }
    const sanitizedFile = parsedFormBody['file-source'].value.replace(/\r\n/g, '\n');
    writeFileSync(filePath, sanitizedFile);
  } else {
    logger.error('event body does not contain `file` or `file-source`');
    return {
      statusCode: 500,
      session,
    };
  }
  return {
    statusCode: 302,
    headers: {
      location: `/admin/files/${fileName}?${encode({ success: true })}`,
    },
    session,
  };
};

export default authMiddleware(saveFileHandler, { adminOnly: true });
