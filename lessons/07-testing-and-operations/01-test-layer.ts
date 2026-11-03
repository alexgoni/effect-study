import { Context, Effect, Layer } from "effect";
import { deepStrictEqual } from "node:assert";

class IdGenerator extends Context.Service<
  IdGenerator,
  {
    readonly next: () => Effect.Effect<string>;
  }
>()("IdGenerator") {}

const createUser = (name: string) =>
  Effect.gen(function* () {
    const idGenerator = yield* Effect.service(IdGenerator);

    const id = yield* idGenerator.next();

    return { id, name };
  });

const testIdGeneratorLayer = Layer.succeed(IdGenerator, {
  next: () => Effect.succeed("test-id-1"),
});

const testProgram = Effect.provide(createUser("test"), testIdGeneratorLayer);

const testResult = Effect.runSync(testProgram);

deepStrictEqual(testResult, {
  id: "test-id-1",
  name: "test",
});

console.log("테스트 통과");
