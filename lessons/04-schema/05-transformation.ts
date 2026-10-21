import { Schema } from "effect";

const FiniteFromStringSchema = Schema.FiniteFromString;

type External = typeof FiniteFromStringSchema.Encoded;
type Internal = typeof FiniteFromStringSchema.Type;

const validInput: unknown = "42";
const invalidInput: unknown = "hello";

const decoder = Schema.decodeUnknownResult(FiniteFromStringSchema);

const validResult = decoder(validInput);
const invalidResult = decoder(invalidInput);

console.log(JSON.stringify(validResult, null, 2));
console.log(JSON.stringify(invalidResult, null, 2));

// ------------------------------------------------

const encoder = Schema.encodeResult(FiniteFromStringSchema);

const validInternalValue = 42;
const invalidInternalValue = NaN;

const validEncodedResult = encoder(validInternalValue);
const invalidEcodedResult = encoder(invalidInternalValue);

console.log(JSON.stringify(validEncodedResult, null, 2));
console.log(JSON.stringify(invalidEcodedResult, null, 2));
