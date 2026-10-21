import { Schema } from "effect";

const PositiveQuantitySchema = Schema.Number.check(Schema.isGreaterThan(0));

const validInput: unknown = 3;
const invalidInput: unknown = 0;

const decoder = Schema.decodeUnknownResult(PositiveQuantitySchema);

const validResult = decoder(validInput);
const invalidResult = decoder(invalidInput);

console.log(JSON.stringify(validResult, null, 2));
console.log(JSON.stringify(invalidResult, null, 2));
