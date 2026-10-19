import { Effect, pipe } from "effect";

const first = Effect.sync(() => {
  console.log("첫 번째 실행");

  return 10;
});

const second = Effect.sync(() => {
  console.log("두 번째 실행");

  return "완료";
});

const program = pipe(first, Effect.andThen(second));

const result = Effect.runSync(program);

console.log({ result });
