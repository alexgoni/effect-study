import { Effect } from "effect";

const acquire = Effect.sync(() => {
  console.log("연결 열기");

  return { id: 1 };
});

const connectionResource = Effect.acquireRelease(acquire, (resource) =>
  Effect.sync(() => {
    console.log(`연결 닫기: ${resource.id}`);
  }),
);

const programWithScope = Effect.gen(function* () {
  const connection = yield* connectionResource;

  yield* Effect.sync(() => {
    console.log(`연결 사용: ${connection.id}`);
  });

  return "완료";
});

const program = Effect.scoped(programWithScope);

console.log(Effect.runSync(program));
