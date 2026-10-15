import { Effect } from "effect";

const program = Effect.sync(() => {
  console.log("Effect 내부 실행");
  return "완료";
});

console.log("program 생성 완료");

const result = await Effect.runPromise(program);

console.log({ result });
