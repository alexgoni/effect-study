import { Effect } from "effect";

const program = Effect.fail("사용자를 찾을 수 없습니다");

const exit = Effect.runSyncExit(program);

console.log({ exit });
console.log(exit._tag);
