import { Effect } from "effect";

const makeTask = (name: string, duration: number) =>
  Effect.gen(function* () {
    yield* Effect.sync(() => {
      console.log(`${name} 시작`);
    });

    yield* Effect.sleep(`${duration} millis`);

    yield* Effect.sync(() => {
      console.log(`${name} 종료`);
    });

    return name;
  });

const taskA = makeTask("A", 300);
const taskB = makeTask("B", 200);
const taskC = makeTask("C", 100);

const programs = Effect.all([taskA, taskB, taskC], {
  concurrency: "unbounded",
});

const startedAt = performance.now();

const results = await Effect.runPromise(programs);

const elapsedMs = performance.now() - startedAt;

console.log({ results, elapsedMs });
