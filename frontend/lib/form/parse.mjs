/**
 * @example
 *  const contentType = event.headers['Content-Type'] || event.headers['content-type'];
 *  const body = event.isBase64Encoded
 *    ? Buffer.from(event.body.toString(), 'base64').toString()
 *    : event.body.toString();
 *  const formData = await parseFormBody(body, {
 *    contentType,
 *  });
 *  logger.debug('Parsed form data', { formData: cleanFormData(formData) });
 */

import Busboy from 'busboy';
import { logger, errorJson } from '../logger/index.mjs';

/**
 * @typedef {Record<string, {
 *   type: "field"
 *   value: string
 * } | {
 *   type: "file"
 *   value: {
 *     fieldname: string
 *     filename: string
 *     contentType: string
 *     content: Buffer
 *     encoding: string
 *   }
 * }>} FormResult
 */

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @returns {Promise<FormResult>}
 */
export const parseFormBody = async (event) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        ...event.headers,
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
    });
    /** @type {FormResult} */
    const result = {};

    busboy.on(
      'file',
      /**
       * @param {string} fieldname
       * @param {import('stream').Readable} file
       * @param {string} filename
       * @param {string} encoding
       * @param {string} contentType
       * @returns {void}
       */
      (fieldname, file, filename, encoding, contentType) => {
        /** @type {Buffer | null} */
        let content = null;

        file.on(
          'data',
          /** @param {Buffer} data */ (data) => {
            logger.info('parsing form file', { fieldname, receivedBytes: data.length });
            if (!content) {
              content = data;
            } else {
              content = Buffer.concat([content, data]);
            }
          },
        );
        file.on('end', () => {
          if (content) {
            result[fieldname] = {
              type: 'file',
              value: {
                fieldname,
                filename,
                contentType,
                content,
                encoding,
              },
            };
          }
        });
      },
    );
    busboy.on('field', (fieldname, value) => {
      logger.info('parsing form field', { fieldname, value });
      result[fieldname] = {
        type: 'field',
        value,
      };
    });
    busboy.on('finish', () => {
      logger.info('finished parsing form');
      resolve(result);
    });
    busboy.on('error', (error) => {
      logger.error('error parsing form', { error: errorJson(error) });
      reject(error);
    });

    if (!event.body) {
      throw new Error('event body not given');
    }
    const buffer = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);
    busboy.write(buffer);
    busboy.end();
  });
};
