import { Effect, Schema } from "effect";

const input: unknown = "not-number";

const effectDecoder = Schema.decodeUnknownEffect(Schema.Number);
const resultDecoder = Schema.decodeUnknownResult(Schema.Number);
const optionDecoder = Schema.decodeUnknownOption(Schema.Number);

const program = effectDecoder(input);
const result = resultDecoder(input);
const option = optionDecoder(input);

const exit = Effect.runSyncExit(program);

console.log(JSON.stringify(exit, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(JSON.stringify(option, null, 2));
