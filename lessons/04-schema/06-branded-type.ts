import { Result, Schema } from "effect";

const PositiveQuantitySchema = Schema.Number.check(
  Schema.isGreaterThan(0),
).pipe(Schema.brand("PositiveQuantity"));

type PositiveQuantity = typeof PositiveQuantitySchema.Type;

const doubleQuantity = (n: PositiveQuantity) => n * 2;

const input: unknown = 3;

const decoder = Schema.decodeUnknownResult(PositiveQuantitySchema);

const result = decoder(input);

if (Result.isSuccess(result)) {
  const doubled = doubleQuantity(result.success);
  console.log({ doubled });
}
