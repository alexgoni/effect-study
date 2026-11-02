import { Deferred, Effect, Fiber, Queue } from "effect";

const program = Effect.gen(function* () {
  const deferred = yield* Deferred.make<string>();

  const childTask = Effect.gen(function* () {
    yield* Effect.sync(() => {
      console.log("자식: 신호 대기");
    });

    const value = yield* Deferred.await(deferred);

    yield* Effect.sync(() => {
      console.log(`자식: ${value}`);
    });

    return value;
  });

  const fiber = yield* Effect.forkChild(childTask);

  yield* Effect.sleep("100 millis");

  yield* Effect.sync(() => {
    console.log("부모: 신호 전송");
  });

  yield* Deferred.succeed(deferred, "준비 완료");

  const result = yield* Fiber.join(fiber);

  return result;
});

console.log(await Effect.runPromise(program));

// ------------------------------------------------

const queueProgram = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<string>();

  yield* Queue.offer(queue, "A");
  yield* Queue.offer(queue, "B");
  yield* Queue.offer(queue, "C");

  const first = yield* Queue.take(queue);
  const second = yield* Queue.take(queue);
  const third = yield* Queue.take(queue);

  return { first, second, third };
});

console.log(await Effect.runPromise(queueProgram));
