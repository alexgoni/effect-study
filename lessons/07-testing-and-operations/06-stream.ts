import { Effect, pipe, Stream } from "effect";

const program = pipe(
  Stream.fromIterable([1, 2, 3]),
  Stream.map((v) => v * 2),
  Stream.runForEach((v) => Effect.logInfo(v)),
);

Effect.runSync(program);

// --------------------------------------------

const failingProgram = pipe(
  Stream.make(1, 2),
  Stream.concat(Stream.fail("stream failed")),
  Stream.runCollect,
);

console.log(JSON.stringify(Effect.runSyncExit(failingProgram), null, 2));
