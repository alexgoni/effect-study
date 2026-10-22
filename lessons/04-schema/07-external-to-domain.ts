import { Effect, Schema } from "effect";

const QuantitySchema = Schema.FiniteFromString.check(
  Schema.isGreaterThan(0),
).pipe(Schema.brand("Quantity"));

const OrderInputSchema = Schema.Struct({
  productId: Schema.String,
  quantity: QuantitySchema,
});

type Quantity = typeof QuantitySchema.Type;
type OrderInput = typeof OrderInputSchema.Type;

const calculateTotal = (q: Quantity) => {
  return q * 100;
};

const validInput: unknown = { productId: "product-1", quantity: "3" };
const invalidInput: unknown = { productId: "product-1", quantity: "0" };

const decoder = Schema.decodeUnknownEffect(OrderInputSchema);

const validProgram = Effect.gen(function* () {
  const decoded = yield* decoder(validInput);
  const q = calculateTotal(decoded.quantity);

  return {
    productId: decoded.productId,
    total: q,
  };
});

const invalidProgram = Effect.gen(function* () {
  const decoded = yield* decoder(invalidInput);
  const q = calculateTotal(decoded.quantity);

  return {
    productId: decoded.productId,
    total: q,
  };
});

const validExit = Effect.runSyncExit(validProgram);
const invalidExit = Effect.runSyncExit(invalidProgram);

console.log(JSON.stringify(validExit, null, 2));
console.log(JSON.stringify(invalidExit, null, 2));
