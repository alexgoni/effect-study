import { Effect, Schema } from "effect";

const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});

type User = typeof UserSchema.Type;

const validInput: unknown = { id: 1, name: "Alex" };
const invalidInput: unknown = { id: "1", name: "Alex" };

const decoder = Schema.decodeUnknownEffect(UserSchema);

const validProgram = decoder(validInput);
const invalidProgram = decoder(invalidInput);

const validExit = Effect.runSyncExit(validProgram);
const invalidExit = Effect.runSyncExit(invalidProgram);

console.log(JSON.stringify(validExit, null, 2));
console.log(JSON.stringify(invalidExit, null, 2));
