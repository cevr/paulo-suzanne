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
 * /admin writes the bucket without triggering a build.
 *
 * Mutation: serviceInstanceDeployV2(serviceId, environmentId) — equivalent to
 * clicking "Deploy" in the dashboard, which rebuilds from the latest source on
 * main. The build step then reads content/site.json from the bucket and bakes
 * it into the prerendered HTML.
 */
import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect';
import {
  HttpBody,
  HttpClient,
  HttpClientRequest,
} from 'effect/unstable/http';

export class RailwayDisabled extends Schema.TaggedErrorClass<RailwayDisabled>()(
  'paulo-suzanne/services/Railway/RailwayDisabled',
  { reason: Schema.String },
) {}

export class RailwayError extends Schema.TaggedErrorClass<RailwayError>()(
  'paulo-suzanne/services/Railway/RailwayError',
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

const DeployResponse = Schema.Struct({
  data: Schema.optional(
    Schema.Struct({
      serviceInstanceDeployV2: Schema.optional(Schema.String),
    }),
  ),
  errors: Schema.optional(Schema.Array(Schema.Struct({ message: Schema.String }))),
});

const decodeDeployResponse = Schema.decodeUnknownEffect(
  Schema.fromJsonString(DeployResponse),
);

export class Railway extends Context.Service<
  Railway,
  {
    readonly enabled: Effect.Effect<boolean>;
    readonly triggerDeploy: Effect.Effect<
      DeployResult,
      RailwayDisabled | RailwayError
    >;
  }
>()('paulo-suzanne/services/Railway') {
  static layer = Layer.effect(
    Railway,
    Effect.gen(function* () {
      const tokenOpt = yield* Config.option(Config.redacted('RAILWAY_API_TOKEN'));
      const serviceIdOpt = yield* Config.option(Config.string('RAILWAY_SERVICE_ID'));
      const environmentIdOpt = yield* Config.option(
        Config.string('RAILWAY_ENVIRONMENT_ID'),
      );
      const httpClient = yield* HttpClient.HttpClient;

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

          return yield* Effect.gen(function* () {
            const body = yield* HttpBody.json({
              query: DEPLOY_MUTATION,
              variables: { serviceId, environmentId },
            });
            const response = yield* httpClient.execute(
              HttpClientRequest.post(ENDPOINT, {
                headers: { Authorization: `Bearer ${token}` },
                body,
              }),
            );
            const text = yield* response.text;
            if (response.status < 200 || response.status >= 300) {
              return yield* new RailwayError({
                message: `HTTP ${response.status}: ${text}`,
              });
            }
            const decoded = yield* decodeDeployResponse(text).pipe(
              Effect.mapError((e) => new RailwayError({ message: String(e) })),
            );
            if (decoded.errors !== undefined && decoded.errors.length > 0) {
              return yield* new RailwayError({
                message: decoded.errors.map((e) => e.message).join('; '),
              });
            }
            const deploymentId = decoded.data?.serviceInstanceDeployV2;
            if (typeof deploymentId !== 'string' || deploymentId === '') {
              return yield* new RailwayError({
                message: `serviceInstanceDeployV2 returned no deployment id: ${text}`,
              });
            }
            return { deploymentId };
          }).pipe(
            Effect.mapError((e) =>
              Schema.is(RailwayError)(e)
                ? e
                : new RailwayError({ message: String(e) }),
            ),
          );
        }),
      });
    }),
  );
}
