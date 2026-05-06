import { MANAGED_ASSETS } from '../app/lib/managed-assets.ts';

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

const mimeFor = (key: string): string => {
  if (key.endsWith('.pdf')) return 'application/pdf';
  if (key.endsWith('.avif')) return 'image/avif';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const asset of MANAGED_ASSETS) {
  const localPath = `./public/${asset.key}`;
  const file = Bun.file(localPath);
  if (!(await file.exists())) {
    // oxlint-disable-next-line no-console
    console.warn(`skip ${asset.key} (not found at ${localPath})`);
    skipped += 1;
    continue;
  }
  try {
    const buf = await file.arrayBuffer();
    await client.write(asset.key, new Uint8Array(buf), { type: mimeFor(asset.key) });
    // oxlint-disable-next-line no-console
    console.log(`uploaded ${asset.key} (${buf.byteLength} bytes)`);
    uploaded += 1;
  } catch (e) {
    // oxlint-disable-next-line no-console
    console.error(`failed ${asset.key}: ${String(e)}`);
    failed += 1;
  }
}

// oxlint-disable-next-line no-console
console.log(`\n${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
