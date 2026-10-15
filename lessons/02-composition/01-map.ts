import { Effect } from "effect";

const source = Effect.succeed(10);

const multiply2AndString = (number: number): string => {
  return String(number * 2);
};

const program = Effect.map(source, multiply2AndString);

const result = Effect.runSync(program);

console.log({ result });
