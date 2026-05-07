import { defaultContent } from '../app/content/defaults.ts';

const endpoint = process.env.SEED_BUCKET_ENDPOINT;
const accessKeyId = process.env.SEED_BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.SEED_BUCKET_SECRET_KEY;
const bucket = process.env.SEED_BUCKET_NAME;

if (
  endpoint === undefined ||
  accessKeyId === undefined ||
  secretAccessKey === undefined ||
  bucket === undefined
) {
  // oxlint-disable-next-line no-console
  console.error(
    'Missing SEED_BUCKET_ENDPOINT / SEED_BUCKET_ACCESS_KEY / SEED_BUCKET_SECRET_KEY / SEED_BUCKET_NAME',
  );
  process.exit(1);
}

const client = new Bun.S3Client({
  endpoint,
  accessKeyId,
  secretAccessKey,
  bucket,
  region: 'auto',
});

const KEY = 'content/site.json';

const existing = client.file(KEY);
if (await existing.exists()) {
  // oxlint-disable-next-line no-console
  console.error(
    `refusing: ${KEY} already exists in ${bucket}. Delete it first if you really want to overwrite.`,
  );
  process.exit(1);
}

const body = JSON.stringify(defaultContent, null, 2);
await client.write(KEY, body, { type: 'application/json' });

// oxlint-disable-next-line no-console
console.log(`seeded ${KEY} (${body.length} bytes) into ${bucket}`);
