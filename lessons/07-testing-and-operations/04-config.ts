import { Config, ConfigProvider, Effect } from "effect";

const config = Config.Port("PORT");

const provider = ConfigProvider.fromUnknown({
  PORT: "3000",
});

const program = config.parse(provider);

console.log(Effect.runSync(program));

// -------------------------------------------

const invalidProvider = ConfigProvider.fromUnknown({
  PORT: "70000",
});

const invalidProgram = config.parse(invalidProvider);

console.log(JSON.stringify(Effect.runSyncExit(invalidProgram), null, 2));
