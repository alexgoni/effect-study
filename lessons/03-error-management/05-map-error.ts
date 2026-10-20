import { Data, Effect } from "effect";

class StorageError extends Data.TaggedError("StorageError")<{
  readonly productId: number;
}> {}

class InventoryUnavailable extends Data.TaggedError("InventoryUnavailable")<{
  readonly productId: number;
}> {}

const loadStock = (productId: number): Effect.Effect<number, StorageError, never> => {
  if (productId === 1) return Effect.succeed(5);
  return Effect.fail(new StorageError({ productId }));
};

const source = loadStock(2);

const mapErrorProgram = Effect.mapError(
  source,
  (error) => new InventoryUnavailable({ productId: error.productId }),
);

const exit = Effect.runSyncExit(mapErrorProgram);

console.log(JSON.stringify(exit, null, 2));
