import { Effect, Schema } from 'effect';

import { defaultContent } from './defaults';
import { SiteContent } from './schema';

const CONTENT_KEY = 'content/site.json';

const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(SiteContent));

/**
 * Build-time content loader.
 *
 * Strict mode is the default. Set ALLOW_DEFAULT_CONTENT=1 (dev / bootstrap) to
 * permit the bundled defaults fallback. In prod we want any of these to FAIL
 * THE BUILD rather than silently ship defaults over previously-published
 * content (`make-operations-idempotent`, `prove-it-works`):
 *   - bucket env missing
 *   - bucket key absent
 *   - S3 read error
 *   - decode error
 *
 * The first-deploy bootstrap problem (no key in bucket yet) is solved by
 * setting ALLOW_DEFAULT_CONTENT=1 for that deploy only, then unsetting it.
 */
export async function loadContent(): Promise<SiteContent> {
  const endpoint = process.env.BUCKET_ENDPOINT;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY;
  const secretAccessKey = process.env.BUCKET_SECRET_KEY;
  const bucket = process.env.BUCKET_NAME;
  const region = process.env.BUCKET_REGION ?? 'auto';
  const allowDefaults = process.env.ALLOW_DEFAULT_CONTENT === '1';

  const fallbackOrThrow = (reason: string): SiteContent => {
    if (allowDefaults) {
      console.info(`[content] ${reason} — using bundled defaults (ALLOW_DEFAULT_CONTENT=1)`);
      return defaultContent;
    }
    throw new Error(
      `[content] ${reason} — refusing to ship defaults. Set ALLOW_DEFAULT_CONTENT=1 to opt in (dev/bootstrap only).`,
    );
  };

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return fallbackOrThrow('bucket env not set');
  }

  const client = new Bun.S3Client({
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region,
  });

  const file = client.file(CONTENT_KEY);

  let exists: boolean;
  try {
    exists = await file.exists();
  } catch (e) {
    throw new Error(
      `[content] S3 exists() failed for ${CONTENT_KEY} — refusing to ship defaults. Cause: ${String(e)}`,
    );
  }

  if (!exists) {
    return fallbackOrThrow(`no ${CONTENT_KEY} in bucket`);
  }

  let text: string;
  try {
    text = await file.text();
  } catch (e) {
    throw new Error(
      `[content] S3 read failed for ${CONTENT_KEY} — refusing to ship defaults. Cause: ${String(e)}`,
    );
  }

  const exit = await Effect.runPromiseExit(decode(text));
  if (exit._tag === 'Success') {
    return exit.value;
  }
  throw new Error(
    `[content] failed to decode ${CONTENT_KEY} — refusing to ship defaults. Cause: ${String(exit.cause)}`,
  );
}
