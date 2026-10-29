import { Effect, Fiber } from "effect";

const childTask = Effect.gen(function* () {
  yield* Effect.sync(() => {
    console.log("자식 시작");
  });

  yield* Effect.sleep("100 millis");

  yield* Effect.sync(() => {
    console.log("자식 완료");
  });

  return 42;
});

const program = Effect.gen(function* () {
  yield* Effect.sync(() => {
    console.log("부모 시작");
  });

  const fiber = yield* Effect.forkChild(childTask);

  yield* Effect.sleep("50 millis");

  yield* Effect.sync(() => {
    console.log("부모 계속");
  });

  const result = yield* Fiber.join(fiber);

  return result;
});

const startedAt = performance.now();
const result = await Effect.runPromise(program);
const elapsedMs = performance.now() - startedAt;

console.log(result);
console.log(`실행 시간: ${elapsedMs.toFixed(1)}ms`);
