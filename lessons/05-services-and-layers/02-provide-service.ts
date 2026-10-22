import { Context, Effect } from "effect";

class Greeter extends Context.Service<
  Greeter,
  {
    readonly greet: (name: string) => Effect.Effect<string>;
  }
>()("Greeter") {}

const program = Effect.gen(function* () {
  const greeter = yield* Effect.service(Greeter);

  const message = yield* greeter.greet("Alex");

  return message;
});

const runnable = Effect.provideService(program, Greeter, {
  greet: (input: string) => Effect.succeed(`Hello, ${input}!`),
});

console.log(Effect.runSync(runnable));
