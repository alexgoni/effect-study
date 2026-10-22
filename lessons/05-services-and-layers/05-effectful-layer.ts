import { Context, Data, Effect, Layer } from "effect";

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

class GreeterSetupError extends Data.TaggedError("GreeterSetupError")<{
  readonly prefix: string;
}> {}

const makeGreeter = (prefix: string) => {
  if (prefix === "") return Effect.fail(new GreeterSetupError({ prefix }));

  return Effect.succeed({
    greet: (name: string) => Effect.succeed(`${prefix}, ${name}!`),
  });
};

const greeterLayer = Layer.effect(Greeter, makeGreeter(""));

const runnable = Effect.provide(program, greeterLayer);

const exit = Effect.runSyncExit(runnable);

console.log(JSON.stringify(exit, null, 2));
