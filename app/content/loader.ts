import { Effect, Schema } from 'effect';

import { defaultContent } from './defaults';
import { SiteContent } from './schema';

const CONTENT_KEY = 'content/site.json';

const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(SiteContent));

/**
 * Build-time content loader.
 *
 * Three outcomes:
 *  1. No bucket configured → return bundled defaults (dev / first-deploy ok)
 *  2. Bucket configured + key missing → return bundled defaults (no editor has
 *     hit Publish yet; legitimate first-deploy state)
 *  3. Bucket configured + S3 errors or decode fails → THROW. We don't silently
 *     bake defaults over a successfully-published payload — that would be a
 *     silent regression invisible to the editor. Make the build fail loud so
 *     Railway shows red and we re-run.
 */
export async function loadContent(): Promise<SiteContent> {
  const endpoint = process.env.BUCKET_ENDPOINT;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY;
  const secretAccessKey = process.env.BUCKET_SECRET_KEY;
  const bucket = process.env.BUCKET_NAME;
  const region = process.env.BUCKET_REGION ?? 'auto';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.info('[content] bucket env not set — using bundled defaults');
    return defaultContent;
  }

  const client = new Bun.S3Client({
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region,
  });

  const file = client.file(CONTENT_KEY);

  const exists = await file.exists();
  if (!exists) {
    console.info(
      `[content] no ${CONTENT_KEY} in bucket — using bundled defaults`,
    );
    return defaultContent;
  }

  const text = await file.text();
  const exit = await Effect.runPromiseExit(decode(text));
  if (exit._tag === 'Success') {
    return exit.value;
  }
  throw new Error(
    `[content] failed to decode ${CONTENT_KEY} — refusing to silently regress to defaults. Cause: ${String(exit.cause)}`,
  );
}
