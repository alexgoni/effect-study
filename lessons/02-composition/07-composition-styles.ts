import { Effect, pipe } from "effect";

const source = Effect.succeed(10);

const validatePositive = (number: number) => {
  if (number > 0) return Effect.succeed(number);

  return Effect.fail("양수가 아닙니다");
};

const multiply2 = (number: number) => {
  return number * 2;
};

const pipelineProgram = pipe(source, Effect.flatMap(validatePositive), Effect.map(multiply2));

const generatorProgram = Effect.gen(function* () {
  const sourceValue = yield* source;
  const validateNumber = yield* validatePositive(sourceValue);

  return multiply2(validateNumber);
});

const pipelineProgramResult = Effect.runSyncExit(pipelineProgram);
const generatorProgramResult = Effect.runSyncExit(generatorProgram);

console.log({ pipelineProgramResult, generatorProgramResult });
