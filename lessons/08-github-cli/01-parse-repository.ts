import { Effect, Schema } from "effect";

const RepositoryResponseSchema = Schema.Struct({
  name: Schema.String,
  full_name: Schema.String,
  stargazers_count: Schema.Int,
});

const decoder = Schema.decodeUnknownEffect(RepositoryResponseSchema);

const fixture: unknown = {
  name: "effect",
  full_name: "Effect-TS/effect",
  stargazers_count: 12345,
};

const program = decoder(fixture);

console.log(JSON.stringify(Effect.runSync(program), null, 2));

// -----------------------------------------------------------------

const invalidFixture: unknown = {
  name: "effect",
  full_name: "Effect-TS/effect",
  stargazers_count: "many",
};

const invalidProgram = decoder(invalidFixture);

console.log(JSON.stringify(Effect.runSyncExit(invalidProgram), null, 2));
