import { Context, Effect, Layer } from "effect";

class Greeter extends Context.Service<
  Greeter,
  {
    readonly greet: (name: string) => Effect.Effect<string>;
  }
>()("Greeter") {}

class Logger extends Context.Service<
  Logger,
  {
    readonly log: (message: string) => Effect.Effect<void>;
  }
>()("Logger") {}

const program = Effect.gen(function* () {
  const greeter = yield* Effect.service(Greeter);
  const logger = yield* Effect.service(Logger);

  const message = yield* greeter.greet("Alex");
  yield* logger.log(message);

  return message;
});

const greeterLayer = Layer.succeed(Greeter, {
  greet: (name: string) => Effect.succeed(`Hello, ${name}!`),
});

const loggerLayer = Layer.succeed(Logger, {
  log: (message: string) => {
    return Effect.sync(() => {
      console.log(`[log] ${message}`);
    });
  },
});

const mergedLayer = Layer.merge(greeterLayer, loggerLayer);

const runnable = Effect.provide(program, mergedLayer);

console.log(Effect.runSync(runnable));
