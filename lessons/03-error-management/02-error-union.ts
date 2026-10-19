import { Data, Effect } from "effect";

class InvalidQuantity extends Data.TaggedError("InvalidQuantity")<{
  readonly quantity: number;
}> {}

class InsufficientStock extends Data.TaggedError("InsufficientStock")<{
  readonly requested: number;
  readonly available: number;
}> {}

const validateQuantity = (quantity: number): Effect.Effect<number, InvalidQuantity, never> => {
  if (quantity > 0) return Effect.succeed(quantity);

  return Effect.fail(new InvalidQuantity({ quantity }));
};

const checkStock = (request: number, stock: number) => {
  if (request <= stock) {
    return Effect.succeed(request);
  }

  return Effect.fail(new InsufficientStock({ requested: request, available: stock }));
};

const program = Effect.gen(function* () {
  const quantity = yield* validateQuantity(3);
  const result = yield* checkStock(quantity, 2);

  return result;
});

const result = Effect.runSyncExit(program);

console.log(JSON.stringify(result, null, 2));
