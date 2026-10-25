import { Context, Effect, Layer } from "effect";

class Counter extends Context.Service<
  Counter,
  {
    readonly next: () => Effect.Effect<number>;
  }
>()("Counter") {}

const makeCounter = Effect.sync(() => {
  console.log("Counter 생성");

  let current = 0;

  return {
    next: () =>
      Effect.sync(() => {
        current++;
        return current;
      }),
  };
});

const counterLayer = Layer.effect(Counter, makeCounter);

const program = Effect.gen(function* () {
  const counter = yield* Effect.service(Counter);

  const first = yield* counter.next();
  const second = yield* counter.next();

  return { first, second };
});

const runnable = Effect.provide(program, counterLayer);

console.log(Effect.runSync(runnable));
console.log(Effect.runSync(runnable));
