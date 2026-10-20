import { Data, Effect } from "effect";

class AttemptError extends Data.TaggedError("AttemptError")<{
  readonly attempt: number;
}> {}

let attempts = 0;

const task = Effect.gen(function* () {
  const currentAttempt = yield* Effect.sync(() => {
    attempts++;
    return attempts;
  });

  if (currentAttempt < 3) {
    yield* Effect.fail(new AttemptError({ attempt: currentAttempt }));
  }

  return "성공";
});

const retriedProgram = Effect.retry(task, { times: 2 });

console.log(Effect.runSyncExit(retriedProgram));
console.log({ attempts });

// ---------------------------------------------------------------------

const slowTask = Effect.gen(function* () {
  yield* Effect.sleep("100 millis");

  return "완료";
});

const timeoutProgram = Effect.timeout(slowTask, "10 millis");

const exit = await Effect.runPromiseExit(timeoutProgram);

console.log(JSON.stringify(exit, null, 2));
