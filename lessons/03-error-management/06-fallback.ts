import { Data, Effect } from "effect";

class StorageError extends Data.TaggedError("StorageError")<{
  readonly productId: number;
}> {}

const loadStock = (productId: number): Effect.Effect<number, StorageError, never> => {
  if (productId === 1) return Effect.succeed(5);
  return Effect.fail(new StorageError({ productId }));
};

const source = loadStock(2);

const program = Effect.orElseSucceed(source, () => 0);

const exit = Effect.runSyncExit(program);

console.log({ exit });
