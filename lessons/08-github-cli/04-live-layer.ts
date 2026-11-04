import { Effect, Layer, Schema } from "effect";
import { RepositoryResponseSchema } from "./01-parse-repository.js";
import {
  InvalidResponse,
  NetworkError,
  RepositoryNotFound,
  Unauthorized,
} from "./02-domain-errors.js";
import { GitHub, type Repository } from "./03-github-service.js";

const RepositoryResponseFromJsonSchema = Schema.fromJsonString(
  RepositoryResponseSchema,
);

const decodeRepositoryResponseJson = Schema.decodeUnknownEffect(
  RepositoryResponseFromJsonSchema,
);

const fetchRepository = (owner: string, repository: string) =>
  Effect.gen(function* () {
    const url = `https://api.github.com/repos/${owner}/${repository}`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          headers: {
            Accept: "application/vnd.github+json",
          },
        }),

      catch: (cause) => new NetworkError({ cause }),
    });

    if (response.status === 404) {
      return yield* Effect.fail(new RepositoryNotFound({ owner, repository }));
    }

    if ([401, 403].includes(response.status)) {
      return yield* Effect.fail(new Unauthorized());
    }

    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (cause) => new NetworkError({ cause }),
    });

    const decoded = yield* decodeRepositoryResponseJson(body).pipe(
      Effect.mapError((cause) => new InvalidResponse({ cause })),
    );

    const result: Repository = {
      name: decoded.name,
      fullName: decoded.full_name,
      stars: decoded.stargazers_count,
    };

    return result;
  });

export const GitHubLive = Layer.succeed(GitHub, {
  getRepository: fetchRepository,
});
