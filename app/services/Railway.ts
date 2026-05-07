/**
 * Railway redeploy trigger.
 *
 * Required env on the deployed Railway service (paulo-suzanne, production):
 *   RAILWAY_API_TOKEN       Project access token, scope: deploy. Never log or
 *                           expose. Rotate via Railway dashboard if leaked.
 *   RAILWAY_SERVICE_ID      The paulo-suzanne service id (UUID).
 *   RAILWAY_ENVIRONMENT_ID  The production environment id (UUID).
 *
 * If any of the three are missing the service stays "disabled" and Save in
 * /admin/content writes the bucket without triggering a build.
 *
 * Mutation: serviceInstanceDeployV2(serviceId, environmentId) — equivalent to
 * clicking "Deploy" in the dashboard, which rebuilds from the latest source on
 * main. The build step then reads content/site.json from the bucket and bakes
 * it into the prerendered HTML.
 */
import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect';

export class RailwayDisabled extends Schema.TaggedErrorClass<RailwayDisabled>()(
  '@paulo-suzanne/services/Railway/RailwayDisabled',
  { reason: Schema.String },
) {}

export class RailwayError extends Schema.TaggedErrorClass<RailwayError>()(
  '@paulo-suzanne/services/Railway/RailwayError',
  { message: Schema.String },
) {}

const ENDPOINT = 'https://backboard.railway.com/graphql/v2';

const DEPLOY_MUTATION = `
mutation Deploy($serviceId: String!, $environmentId: String!) {
  serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
}
`.trim();

export type DeployResult = {
  readonly deploymentId: string;
};

export class Railway extends Context.Service<
  Railway,
  {
    readonly enabled: Effect.Effect<boolean>;
    readonly triggerDeploy: Effect.Effect<
      DeployResult,
      RailwayDisabled | RailwayError
    >;
  }
>()('@paulo-suzanne/services/Railway') {
  static layer = Layer.effect(
    Railway,
    Effect.gen(function* () {
      const tokenOpt = yield* Config.option(Config.redacted('RAILWAY_API_TOKEN'));
      const serviceIdOpt = yield* Config.option(Config.string('RAILWAY_SERVICE_ID'));
      const environmentIdOpt = yield* Config.option(
        Config.string('RAILWAY_ENVIRONMENT_ID'),
      );

      const isEnabled =
        Option.isSome(tokenOpt) &&
        Option.isSome(serviceIdOpt) &&
        Option.isSome(environmentIdOpt);

      return Railway.of({
        enabled: Effect.succeed(isEnabled),

        triggerDeploy: Effect.gen(function* () {
          if (
            Option.isNone(tokenOpt) ||
            Option.isNone(serviceIdOpt) ||
            Option.isNone(environmentIdOpt)
          ) {
            return yield* new RailwayDisabled({
              reason:
                'RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID and RAILWAY_ENVIRONMENT_ID must all be set',
            });
          }

          const token = Redacted.value(tokenOpt.value);
          const serviceId = serviceIdOpt.value;
          const environmentId = environmentIdOpt.value;

          return yield* Effect.tryPromise({
            try: async () => {
              const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: DEPLOY_MUTATION,
                  variables: { serviceId, environmentId },
                }),
              });
              const text = await res.text();
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${text}`);
              }
              const json = JSON.parse(text) as {
                data?: { serviceInstanceDeployV2?: string };
                errors?: Array<{ message: string }>;
              };
              if (json.errors && json.errors.length > 0) {
                throw new Error(json.errors.map((e) => e.message).join('; '));
              }
              const deploymentId = json.data?.serviceInstanceDeployV2;
              if (typeof deploymentId !== 'string' || deploymentId === '') {
                throw new Error(
                  `serviceInstanceDeployV2 returned no deployment id: ${text}`,
                );
              }
              return { deploymentId };
            },
            catch: (e) => new RailwayError({ message: String(e) }),
          });
        }),
      });
    }),
  );
}
