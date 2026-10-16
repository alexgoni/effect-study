import { Effect } from "effect";

const source = Effect.succeed(10);

const oneHundreadDivideNumber = (number: number) => {
  if (number === 0) {
    return Effect.fail("cannot divide with 0");
  }

  return Effect.succeed(100 / number);
};

const nested = Effect.map(source, oneHundreadDivideNumber);
const program = Effect.flatMap(source, oneHundreadDivideNumber);

const result = Effect.runSyncExit(program);

console.log({ result });
