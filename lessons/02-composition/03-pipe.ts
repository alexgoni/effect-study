import { Effect, pipe } from "effect";

const source = Effect.succeed(5);

const program = pipe(
  source,
  Effect.map((n) => n + 1),
  Effect.map((n) => n * 2),
  Effect.map((n) => String(n)),
);

const result = Effect.runSync(program);

console.log({ result });
