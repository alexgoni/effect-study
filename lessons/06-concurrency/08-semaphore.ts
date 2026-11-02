import { Effect, TxSemaphore } from "effect";

const program = Effect.gen(function* () {
  const semaphore = yield* TxSemaphore.make(1);

  const makeTask = (name: string) =>
    Effect.gen(function* () {
      yield* Effect.sync(() => {
        console.log(`${name}: 일반 작업`);
      });

      const result = yield* TxSemaphore.withPermit(
        semaphore,
        Effect.gen(function* () {
          yield* Effect.sync(() => {
            console.log(`${name}: 보호 구간 진입`);
          });

          yield* Effect.sleep("100 millis");

          yield* Effect.sync(() => {
            console.log(`${name}: 보호 구간 종료`);
          });

          return name;
        }),
      );

      return result;
    });

  const taskA = makeTask("A");
  const taskB = makeTask("B");
  const taskC = makeTask("C");

  const results = yield* Effect.all([taskA, taskB, taskC], {
    concurrency: "unbounded",
  });

  return results;
});

console.log(await Effect.runPromise(program));
