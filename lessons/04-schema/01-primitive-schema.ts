import { Effect, Schema } from "effect";

const validInput: unknown = "Alex";

const invalidInput: unknown = 123;

const decoder = Schema.decodeUnknownEffect(Schema.String);

const validProgram = decoder(validInput);

const invalidProgram = decoder(invalidInput);

const validExit = Effect.runSyncExit(validProgram);

const invalidExit = Effect.runSyncExit(invalidProgram);

console.log(JSON.stringify(validExit, null, 2));
console.log(JSON.stringify(invalidExit, null, 2));
