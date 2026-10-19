import { Effect } from "effect";

const first = Effect.sync(() => {
  console.log("첫 번째 실행");

  return 10;
});

const failure = Effect.fail("중간 실패");

const last = Effect.sync(() => {
  console.log("실패 이후 실행");

  return 30;
});

const program = Effect.gen(function* () {
  yield* first;
  yield* failure;
  const value = yield* last;

  return value;
});

const result = Effect.runSyncExit(program);

console.log({ result });
