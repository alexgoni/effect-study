import { Data, Effect, Schema } from "effect";

class RepositoryNotFound extends Data.TaggedError("RepositoryNotFound")<{
  readonly owner: string;
  readonly repository: string;
}> {}

class Unauthorized extends Data.TaggedError("Unauthorized") {}

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown;
}> {}

class InvalidResponse extends Data.TaggedError("InvalidResponse")<{
  readonly cause: Schema.SchemaError;
}> {}

type GitHubError =
  | NetworkError
  | Unauthorized
  | RepositoryNotFound
  | InvalidResponse;

const failGitHub = (error: GitHubError) => Effect.fail(error);

const error = new RepositoryNotFound({ owner: "asdf", repository: "asdf" });

console.log(JSON.stringify(Effect.runSyncExit(failGitHub(error)), null, 2));
