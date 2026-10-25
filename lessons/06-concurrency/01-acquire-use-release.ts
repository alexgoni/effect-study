import { Effect } from "effect";

const acquire = Effect.sync(() => {
  console.log("연결 열기");

  return { id: 1 };
});

const program = Effect.acquireUseRelease(
  acquire,
  (resource) => {
    return Effect.gen(function* () {
      yield* Effect.sync(() => {
        console.log(`연결 사용: ${resource.id}`);
      });

      yield* Effect.fail("사용 실패");
    });
  },
  (resource, _exit) => {
    return Effect.sync(() => {
      console.log(`연결 닫기: ${resource.id}`);
    });
  },
);

console.log(Effect.runSyncExit(program));
