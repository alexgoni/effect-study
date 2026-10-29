import { Effect, Fiber } from "effect";

const acquire = Effect.sync(() => {
  console.log("자원 획득");

  return { id: 1 };
});

const use = (_resource: { readonly id: number }) =>
  Effect.gen(function* () {
    yield* Effect.sync(() => {
      console.log("작업 시작");
    });

    yield* Effect.sleep("1000 millis");

    yield* Effect.sync(() => {
      console.log("작업 완료");
    });
  });

const release = (_resource: { readonly id: number }) =>
  Effect.sync(() => {
    console.log("자원 해제");
  });

const childProgram = Effect.acquireUseRelease(acquire, use, release);

const program = Effect.gen(function* () {
  const fiber = yield* Effect.forkChild(childProgram);

  yield* Effect.sleep("50 millis");

  yield* Effect.sync(() => {
    console.log("중단 요청");
  });

  yield* Fiber.interrupt(fiber);

  yield* Effect.sync(() => {
    console.log("중단 완료");
  });
});

console.log(await Effect.runPromise(program));
