import { Effect } from "effect";

const program = Effect.promise(() => {
  console.log("Promise 생성");

  const promise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("비동기 완료");
    }, 100);
  });

  return promise;
});

console.log("program 생성 완료");

const result = await Effect.runPromise(program);

console.log({ result });
