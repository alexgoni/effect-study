import { Data, Schema } from "effect";

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

export { InvalidResponse, NetworkError, RepositoryNotFound, Unauthorized };
export type { GitHubError };
