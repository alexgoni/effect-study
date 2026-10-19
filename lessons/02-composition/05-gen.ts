import { Effect } from "effect";

const price = Effect.succeed(10_000);
const quantity = Effect.succeed(3);

const program = Effect.gen(function* () {
  const p = yield* price;
  const q = yield* quantity;

  return p * q;
});

const result = Effect.runSync(program);

console.log({ result });
