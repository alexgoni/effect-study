import { Effect, Exit, Layer } from "effect";
import { deepStrictEqual } from "node:assert";
import { RepositoryNotFound } from "./02-domain-errors.js";
import {
  getRepositoryProgram,
  GitHub,
  type Repository,
} from "./03-github-service.js";

const fixture: Repository = {
  name: "effect",
  fullName: "Effect-TS/effect",
  stars: 12345,
};

const GitHubTest = Layer.succeed(GitHub, {
  getRepository: (owner: string, repository: string) => {
    if (owner === "Effect-TS" && repository === "effect") {
      return Effect.succeed(fixture);
    }

    return Effect.fail(new RepositoryNotFound({ owner, repository }));
  },
});

const program = getRepositoryProgram("Effect-TS", "effect");

const runnable = Effect.provide(program, GitHubTest);

const result = Effect.runSync(runnable);

deepStrictEqual(result, fixture);

const missingProgram = getRepositoryProgram("Effect-TS", "missing");
const missingRunnable = Effect.provide(missingProgram, GitHubTest);
const missingExit = Effect.runSyncExit(missingRunnable);

const expectedError = new RepositoryNotFound({
  owner: "Effect-TS",
  repository: "missing",
});

deepStrictEqual(missingExit, Exit.fail(expectedError));
