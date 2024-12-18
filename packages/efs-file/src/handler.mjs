import { dirname, join } from 'path';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';

import { z } from 'zod';

const eventSchema = z.object({
  tf: z.object({
    action: z.enum(['create', 'update', 'delete']),
    prev_input: z
      .object({
        path: z.string(),
        data: z.string(),
      })
      .nullable(),
  }),
  path: z.string(),
  data: z.string(),
});

/**
 * @param {object} event
 * @param {object} context
 */
export async function lambdaHandler(event, context) {
  const parsed = eventSchema.parse(event);

  if (parsed.tf.action === 'create') {
    const targetPath = join('/mnt/efs', parsed.path);
    console.log(`creating new file: ${targetPath}`);
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, parsed.data);
    return;
  }

  if (parsed.tf.action === 'update') {
    const targetPath = join('/mnt/efs', parsed.path);
    console.log(`creating new file: ${targetPath}`);
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, parsed.data);
  }

  if (parsed.tf.prev_input !== null && parsed.tf.prev_input.path !== parsed.path) {
    const targetOldPath = join('/mnt/efs', parsed.tf.prev_input.path);
    console.log(`deleting old file: ${targetOldPath}`);
    try {
      rmSync(targetOldPath);
    } catch (err) {
      // pass
    }
  }
}
