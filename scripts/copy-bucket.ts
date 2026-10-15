/**
 * Copy every object of an S3-compatible bucket into the site's R2 bucket.
 *
 *   SRC_BUCKET_ENDPOINT, SRC_BUCKET_ACCESS_KEY, SRC_BUCKET_SECRET_KEY,
 *   SRC_BUCKET_NAME  the source bucket (the old Railway bucket)
 *   bun scripts/copy-bucket.ts <r2-bucket-name>
 *
 * Objects are downloaded into `.data/bucket` first, which is also the dev
 * server's bucket, then uploaded with `cf r2 objects put`. Each object keeps
 * its content type. Run it again to bring R2 up to date: every object is
 * copied again, and nothing in R2 is deleted.
 */
const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
};

const target = process.argv[2];
if (target === undefined) {
  console.error("Usage: bun scripts/copy-bucket.ts <r2-bucket-name>");
  process.exit(1);
}

const source = new Bun.S3Client({
  endpoint: env("SRC_BUCKET_ENDPOINT"),
  accessKeyId: env("SRC_BUCKET_ACCESS_KEY"),
  secretAccessKey: env("SRC_BUCKET_SECRET_KEY"),
  bucket: env("SRC_BUCKET_NAME"),
  region: "auto",
});

const keys: string[] = [];
let continuationToken: string | undefined;
do {
  const page = await source.list({ continuationToken });
  for (const item of page.contents ?? []) keys.push(item.key);
  continuationToken = page.nextContinuationToken;
} while (continuationToken !== undefined);

let failed = 0;
for (const key of keys) {
  const file = source.file(key);
  const stat = await file.stat();
  const local = `.data/bucket/${key}`;
  await Bun.write(local, await file.arrayBuffer());
  const put = Bun.spawnSync([
    "cf",
    "r2",
    "objects",
    "put",
    key,
    "--bucket-name",
    target,
    "--file",
    local,
    "--content-type",
    stat.type || "application/octet-stream",
    "--quiet",
  ]);
  if (put.exitCode === 0) {
    console.log(`copied ${key} (${stat.size} bytes)`);
  } else {
    failed += 1;
    console.error(`FAILED ${key}: ${put.stderr.toString().trim()}`);
  }
}

console.log(`${keys.length - failed} of ${keys.length} objects copied to ${target}`);
if (failed > 0) process.exit(1);
