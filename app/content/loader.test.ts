import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { defaultContent } from './defaults';
import { loadContent } from './loader';

const ENV_KEYS = [
  'BUCKET_ENDPOINT',
  'BUCKET_ACCESS_KEY',
  'BUCKET_SECRET_KEY',
  'BUCKET_NAME',
  'BUCKET_REGION',
  'ALLOW_DEFAULT_CONTENT',
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) saved[k] = process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function clearBucketEnv() {
  delete process.env.BUCKET_ENDPOINT;
  delete process.env.BUCKET_ACCESS_KEY;
  delete process.env.BUCKET_SECRET_KEY;
  delete process.env.BUCKET_NAME;
  delete process.env.BUCKET_REGION;
}

describe('loadContent', () => {
  it('returns bundled defaults when bucket env is unset and ALLOW_DEFAULT_CONTENT=1', async () => {
    clearBucketEnv();
    process.env.ALLOW_DEFAULT_CONTENT = '1';
    const content = await loadContent();
    expect(content).toEqual(defaultContent);
  });

  it('throws when bucket env is unset and ALLOW_DEFAULT_CONTENT is unset', async () => {
    clearBucketEnv();
    delete process.env.ALLOW_DEFAULT_CONTENT;
    let threw = false;
    try {
      await loadContent();
    } catch (e) {
      threw = true;
      expect(String(e)).toContain('bucket env not set');
      expect(String(e)).toContain('refusing to ship defaults');
    }
    expect(threw).toBe(true);
  });

  it('throws when ALLOW_DEFAULT_CONTENT is "0" (anything other than "1")', async () => {
    clearBucketEnv();
    process.env.ALLOW_DEFAULT_CONTENT = '0';
    let threw = false;
    try {
      await loadContent();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
