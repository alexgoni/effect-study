import { Context, Effect } from "effect";
import type { GitHubError } from "./02-domain-errors.js";

interface Repository {
  name: string;
  fullName: string;
  stars: number;
}

interface GitHubService {
  readonly getRepository: (
    owner: string,
    repository: string,
  ) => Effect.Effect<Repository, GitHubError>;
}

class GitHub extends Context.Service<GitHub, GitHubService>()("GitHub") {}

const getRepositoryProgram = (owner: string, repository: string) =>
  Effect.gen(function* () {
    const github = yield* Effect.service(GitHub);

    const result = yield* github.getRepository(owner, repository);

    return result;
  });
