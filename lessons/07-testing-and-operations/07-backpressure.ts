import { Effect, pipe, Stream } from "effect";

const program = pipe(
  Stream.range(1, 3),
  Stream.tap((v) => Effect.logInfo(`생산: ${v}`)),
  Stream.mapEffect(
    (v) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`소비 시작: ${v}`);

        yield* Effect.sleep("200 millis");

        yield* Effect.logInfo(`소비 완료: ${v}`);

        return v;
      }),
    { concurrency: 2 },
  ),
  Stream.runDrain,
);

await Effect.runPromise(program);
