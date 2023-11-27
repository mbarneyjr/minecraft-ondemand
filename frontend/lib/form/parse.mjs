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
 * @param {string} body
 * @param {{
 *   contentType?: string,
 * }} options
 * @returns {Promise<FormResult>}
 */
export const parseFormBody = async (body, options) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        'content-type': options.contentType,
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
            content = data;
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
      result[fieldname] = {
        type: 'field',
        value,
      };
    });
    busboy.on('finish', () => {
      resolve(result);
    });
    busboy.on('error', (error) => {
      reject(error);
    });
    busboy.write(body);
    busboy.end();
  });
};
