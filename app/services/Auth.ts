import { Clock, Config, Context, Effect, Layer, Redacted, Schema } from 'effect';

export class BadPassword extends Schema.TaggedError<BadPassword>()(
  'paulo-suzanne/services/Auth/BadPassword',
  {},
) {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  'paulo-suzanne/services/Auth/Unauthorized',
  {},
) {}

const COOKIE_NAME = 'ps_admin';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

const toBase64Url = (bytes: Uint8Array): string => {
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const importKey = (secret: string): Effect.Effect<CryptoKey> =>
  Effect.promise(() =>
    crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
    ),
  );

const sign = (secret: string, payload: string): Effect.Effect<string> =>
  Effect.gen(function* () {
  const key = yield* importKey(secret);
  const sig = yield* Effect.promise(() =>
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)),
  );
  return toBase64Url(new Uint8Array(sig));
  });

const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
};

const verifySig = (
  secret: string,
  payload: string,
  sig: string,
): Effect.Effect<boolean> =>
  Effect.gen(function* () {
  const expected = yield* sign(secret, payload);
  return constantTimeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(sig));
  });

const parseCookie = (header: string | null, name: string): string | null => {
  if (header === null) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
};

export class Auth extends Context.Service<
  Auth,
  {
    readonly verifyPassword: (password: string) => Effect.Effect<string, BadPassword>;
    readonly checkCookie: (cookieHeader: string | null) => Effect.Effect<void, Unauthorized>;
    readonly cookieHeader: (token: string) => string;
    readonly clearCookieHeader: () => string;
  }
>()('paulo-suzanne/services/Auth') {
  static layer = Layer.effect(
    Auth,
    Effect.gen(function* () {
      const adminPassword = yield* Config.redacted('ADMIN_PASSWORD').pipe(
        Config.withDefault(Redacted.make('')),
      );
      const cookieSecret = yield* Config.redacted('COOKIE_SECRET');

      const adminPw = Redacted.value(adminPassword);
      const secret = Redacted.value(cookieSecret);

      const issueToken = (): Effect.Effect<string> =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          const issued = Math.floor(now / 1000);
          const expires = issued + TOKEN_TTL_SECONDS;
          const payload = `${issued}.${expires}`;
          const sig = yield* sign(secret, payload);
          return `${payload}.${sig}`;
        });

      const validateToken = (token: string): Effect.Effect<void, Unauthorized> =>
        Effect.gen(function* () {
          const parts = token.split('.');
          if (parts.length !== 3) return yield* new Unauthorized();
          const [issuedStr, expiresStr, sig] = parts as [string, string, string];
          const expires = Number(expiresStr);
          if (!Number.isFinite(expires)) return yield* new Unauthorized();
          const now = yield* Clock.currentTimeMillis;
          if (expires < Math.floor(now / 1000)) return yield* new Unauthorized();
          const ok = yield* verifySig(secret, `${issuedStr}.${expiresStr}`, sig);
          if (!ok) return yield* new Unauthorized();
        });

      return Auth.of({
        verifyPassword: (password) =>
          Effect.gen(function* () {
            if (adminPw === '') return yield* new BadPassword();
            const a = new TextEncoder().encode(password);
            const b = new TextEncoder().encode(adminPw);
            if (!constantTimeEqual(a, b)) return yield* new BadPassword();
            return yield* issueToken();
          }),

        checkCookie: (header) =>
          Effect.gen(function* () {
            const token = parseCookie(header, COOKIE_NAME);
            if (token === null) return yield* new Unauthorized();
            yield* validateToken(token);
          }),

        cookieHeader: (token) =>
          `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TOKEN_TTL_SECONDS}`,

        clearCookieHeader: () => `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      });
    }),
  );
}
