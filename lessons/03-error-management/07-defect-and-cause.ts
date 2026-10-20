import { Effect } from "effect";

const fail = Effect.fail("예상된 실패");

const defect = Effect.die("defect");

const failedProgram = Effect.catch(fail, () => Effect.succeed("복구됨"));

const diedProgram = Effect.catch(defect, () => Effect.succeed("복구됨"));

console.log(Effect.runSyncExit(failedProgram));
console.log(JSON.stringify(Effect.runSyncExit(diedProgram), null, 2));
