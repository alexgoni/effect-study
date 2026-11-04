import { Effect, Layer, Schedule } from "effect";
import { getRepositoryProgram, GitHub } from "./03-github-service.js";

interface RepositoryTarget {
  owner: string;
  repository: string;
}

const targets: ReadonlyArray<RepositoryTarget> = [
  { owner: "Effect-TS", repository: "effect" },
  { owner: "Effect-TS", repository: "website" },
  { owner: "facebook", repository: "react" },
  { owner: "vuejs", repository: "core" },
];

const retrySchedule = Schedule.exponential("100 millis").pipe(
  Schedule.upTo({ times: 2 }),
);

const getRepositoryWithRetry = (owner: string, repository: string) =>
  getRepositoryProgram(owner, repository).pipe(
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error._tag === "NetworkError",
    }),
  );

const fetchRepositories = (targets: ReadonlyArray<RepositoryTarget>) => {
  const array = targets.map(({ owner, repository }) =>
    getRepositoryWithRetry(owner, repository),
  );

  return Effect.all(array, { concurrency: 2 }).pipe(
    Effect.timeout("10 seconds"),
  );
};

const GitHubSlowTest = Layer.succeed(GitHub, {
  getRepository: (owner: string, repository: string) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`시작: ${owner}/${repository}`);

      yield* Effect.sleep("100 millis");

      yield* Effect.logInfo(`완료: ${owner}/${repository}`);

      return {
        name: repository,
        fullName: `${owner}/${repository}`,
        stars: 0,
      };
    }),
});

const program = Effect.provide(fetchRepositories(targets), GitHubSlowTest);

const result = await Effect.runPromiseExit(program);

console.log(result);
