import { Data, Effect } from "effect";

class InvalidQuantity extends Data.TaggedError("InvalidQuantity")<{
  readonly quantity: number;
}> {}

const validateQuantity = (quantity: number): Effect.Effect<number, InvalidQuantity, never> => {
  if (quantity > 0) return Effect.succeed(quantity);

  return Effect.fail(new InvalidQuantity({ quantity }));
};

const program = validateQuantity(0);

const result = Effect.runSyncExit(program);

console.log(JSON.stringify(result, null, 2));
