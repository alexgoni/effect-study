import { Context, Effect, Layer } from "effect";

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

const greet = {
  greet: (name: string) => Effect.succeed(`Hello, ${name}!`),
};

const greeterLayer = Layer.succeed(Greeter, greet);

const runnable = Effect.provide(program, greeterLayer);

console.log(Effect.runSync(runnable));
