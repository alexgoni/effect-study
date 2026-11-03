import { Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";

const delayedTask = Effect.gen(function* () {
  yield* Effect.sleep("1 hour");

  yield* Effect.sync(() => {
    console.log("완료");
  });

  return "완료";
});

const testProgram = Effect.gen(function* () {
  const fiber = yield* Effect.forkChild(delayedTask);

  yield* TestClock.adjust("1 hour");

  const result = yield* Fiber.join(fiber);

  return result;
});

const runnable = Effect.provide(testProgram, TestClock.layer());

console.log(await Effect.runPromise(runnable));
