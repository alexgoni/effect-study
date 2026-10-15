import { Effect } from "effect";

const program = Effect.succeed("Hello, Effect!");

const result = await Effect.runPromise(program);

console.log({ result });
