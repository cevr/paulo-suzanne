/**
 * The deploy, checked against real Cloudflare: a throwaway `test_$USER` stage
 * is deployed, seeded with the bundled default content, probed and destroyed
 * in one scope, so a failure destroys it too.
 *
 * Outside the gate's test folder pattern on purpose, so the gate never
 * deploys. Run it with `bun run test:deploy` (it builds first) before handing
 * off a change to the stack, the Worker, or the Alchemy or Effect versions.
 * It reads `ADMIN_PASSWORD` and `COOKIE_SECRET` from `.env`, and seeds the
 * bucket with the `cf` CLI, so `cf` must be logged in to the same account.
 */
import { expect } from "bun:test";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Test from "alchemy/Test/Bun";
import { Effect, FileSystem, Option, Schedule, Schema } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { defaultContent } from "../app/content/defaults.ts";
import { SiteContent } from "../app/content/schema.ts";
import { CACHE } from "../src/server/render.ts";
import Stack, { providers } from "../alchemy.run.ts";

const { test, deploy, destroy } = Test.make({ providers, state: Cloudflare.state() });

const deployed = Effect.acquireRelease(deploy(Stack), () => destroy(Stack).pipe(Effect.orDie));

/** Publish the bundled defaults, as the admin's first publish would. */
const seed = Effect.fn("seed")(function* (bucket: string) {
  const fs = yield* FileSystem.FileSystem;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const file = yield* fs.makeTempFileScoped({ suffix: ".json" });
  yield* fs.writeFileString(
    file,
    yield* Schema.encodeEffect(Schema.fromJsonString(SiteContent))(defaultContent),
  );
  const put = ChildProcess.make("cf", [
    "r2",
    "objects",
    "put",
    "content/site.json",
    "--bucket-name",
    bucket,
    "--file",
    file,
    "--content-type",
    "application/json",
    "--quiet",
  ]);
  const exitCode: number = yield* spawner.exitCode(put);
  expect(exitCode).toBe(0);
});

test(
  "the site serves its pages, assets and admin from Cloudflare",
  Effect.gen(function* () {
    const outputs = yield* deployed;
    const url = yield* Effect.fromOption(Option.fromNullishOr(outputs.url));
    const bucket = yield* Effect.fromOption(Option.fromNullishOr(outputs.bucket));
    yield* seed(bucket);

    const raw = yield* HttpClient.HttpClient;
    const client = raw.pipe(HttpClient.filterStatusOk);
    // A fresh workers.dev host can answer 404 for a few seconds after deploy.
    const get = (path: string) =>
      client
        .get(`${url}${path}`)
        .pipe(Effect.retry({ schedule: Schedule.exponential("1 second"), times: 8 }));

    const home = yield* get("/en");
    const html = yield* home.text;
    expect(html).toContain("The Original Casse-Croûte");
    expect(home.headers["cache-control"]).toBe(CACHE.page);

    const asset = /\/assets\/[^"]+\.css/.exec(html)?.[0] ?? "/missing.css";
    const css = yield* get(asset);
    expect(css.headers["cache-control"]).toBe("public, max-age=31536000, immutable");

    // The admin sends a visitor without a session to its login page, uncached.
    const login = yield* get("/admin");
    expect(yield* login.text).toContain('name="password"');
    expect(login.headers["cache-control"]).toBe(CACHE.private);

    // A wrong password is refused, so the Worker has its secrets.
    const refused = yield* raw.execute(
      HttpClientRequest.post(`${url}/admin/login`).pipe(
        HttpClientRequest.bodyUrlParams({ password: "not-the-password" }),
      ),
    );
    expect(refused.status).toBe(401);
  }).pipe(Effect.scoped),
  { timeout: 600_000 },
);
