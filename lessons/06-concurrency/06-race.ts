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

const fastTask = makeTask("fast", 100);
const slowTask = makeTask("slow", 300);

const program = Effect.race(fastTask, slowTask);

const startedAt = performance.now();

const result = await Effect.runPromise(program);

const elapsedMs = performance.now() - startedAt;

console.log({ result, elapsedMs });
