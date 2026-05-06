import { describe, expect, it } from 'effect-bun-test';
import { ConfigProvider, Effect, Layer } from 'effect';
import { Auth, BadPassword, Unauthorized } from './Auth.ts';

const TestConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    ADMIN_PASSWORD: 'secret-pw',
    COOKIE_SECRET: 'a'.repeat(64),
  }),
);

const TestLayer = Auth.layer.pipe(Layer.provide(TestConfig));

describe('Auth', () => {
  it.effect('rejects wrong password', () =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const result = yield* Effect.flip(auth.verifyPassword('nope'));
      expect(result).toBeInstanceOf(BadPassword);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('issues token for correct password and validates round-trip', () =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const token = yield* auth.verifyPassword('secret-pw');
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const cookieHeader = `ps_admin=${token}; other=junk`;
      yield* auth.checkCookie(cookieHeader);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('rejects missing cookie', () =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const result = yield* Effect.flip(auth.checkCookie(null));
      expect(result).toBeInstanceOf(Unauthorized);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('rejects tampered token', () =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const token = yield* auth.verifyPassword('secret-pw');
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}.AAAA${parts[2]?.slice(4) ?? ''}`;
      const result = yield* Effect.flip(auth.checkCookie(`ps_admin=${tampered}`));
      expect(result).toBeInstanceOf(Unauthorized);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('cookieHeader is well-formed', () =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const header = auth.cookieHeader('xyz');
      expect(header).toContain('ps_admin=xyz');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
    }).pipe(Effect.provide(TestLayer)),
  );
});
