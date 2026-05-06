import { MANAGED_ASSETS } from '../app/lib/managed-assets.ts';

const srcEndpoint = process.env.SRC_BUCKET_ENDPOINT;
const srcAccessKey = process.env.SRC_BUCKET_ACCESS_KEY;
const srcSecretKey = process.env.SRC_BUCKET_SECRET_KEY;
const srcBucket = process.env.SRC_BUCKET_NAME;

const dstEndpoint = process.env.DST_BUCKET_ENDPOINT;
const dstAccessKey = process.env.DST_BUCKET_ACCESS_KEY;
const dstSecretKey = process.env.DST_BUCKET_SECRET_KEY;
const dstBucket = process.env.DST_BUCKET_NAME;

if (
  srcEndpoint === undefined ||
  srcAccessKey === undefined ||
  srcSecretKey === undefined ||
  srcBucket === undefined ||
  dstEndpoint === undefined ||
  dstAccessKey === undefined ||
  dstSecretKey === undefined ||
  dstBucket === undefined
) {
  // oxlint-disable-next-line no-console
  console.error('Missing SRC_BUCKET_* or DST_BUCKET_* env vars');
  process.exit(1);
}

const src = new Bun.S3Client({
  endpoint: srcEndpoint,
  accessKeyId: srcAccessKey,
  secretAccessKey: srcSecretKey,
  bucket: srcBucket,
  region: 'auto',
});

const dst = new Bun.S3Client({
  endpoint: dstEndpoint,
  accessKeyId: dstAccessKey,
  secretAccessKey: dstSecretKey,
  bucket: dstBucket,
  region: 'auto',
});

const mimeFor = (key: string): string => {
  if (key.endsWith('.pdf')) return 'application/pdf';
  if (key.endsWith('.avif')) return 'image/avif';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

let copied = 0;
let missing = 0;
let failed = 0;

for (const asset of MANAGED_ASSETS) {
  try {
    const srcFile = src.file(asset.key);
    const exists = await srcFile.exists();
    if (!exists) {
      // oxlint-disable-next-line no-console
      console.warn(`missing in source: ${asset.key}`);
      missing += 1;
      continue;
    }
    const buf = await srcFile.arrayBuffer();
    await dst.write(asset.key, new Uint8Array(buf), { type: mimeFor(asset.key) });
    // oxlint-disable-next-line no-console
    console.log(`copied ${asset.key} (${buf.byteLength} bytes)`);
    copied += 1;
  } catch (e) {
    // oxlint-disable-next-line no-console
    console.error(`failed ${asset.key}: ${String(e)}`);
    failed += 1;
  }
}

// oxlint-disable-next-line no-console
console.log(`\n${copied} copied, ${missing} missing, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
