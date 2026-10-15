import { Effect } from "effect";

const input = '{"name": "Alex", "age": }';

const program = Effect.try(() => {
  return JSON.parse(input);
});

const exit = Effect.runSyncExit(program);
const tag = exit._tag;

console.log({ tag });

if (tag === "Failure") {
  console.dir(exit.cause);
}
