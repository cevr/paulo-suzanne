import { Effect, Schema } from 'effect';

import { defaultContent } from './defaults';
import { SiteContent } from './schema';

const CONTENT_KEY = 'content/site.json';

const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(SiteContent));

export async function loadContent(): Promise<SiteContent> {
  const endpoint = process.env.BUCKET_ENDPOINT;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY;
  const secretAccessKey = process.env.BUCKET_SECRET_KEY;
  const bucket = process.env.BUCKET_NAME;
  const region = process.env.BUCKET_REGION ?? 'auto';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return defaultContent;
  }

  try {
    const client = new Bun.S3Client({
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucket,
      region,
    });

    const file = client.file(CONTENT_KEY);
    if (!(await file.exists())) {
      return defaultContent;
    }

    const text = await file.text();
    const exit = await Effect.runPromiseExit(decode(text));
    if (exit._tag === 'Success') {
      return exit.value;
    }
    console.warn('[content] decode failed, using defaults:', exit.cause);
    return defaultContent;
  } catch (e) {
    console.warn('[content] load failed, using defaults:', e);
    return defaultContent;
  }
}
