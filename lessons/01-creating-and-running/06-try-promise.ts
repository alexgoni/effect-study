import { Effect } from "effect";

const program = Effect.tryPromise(() => {
  console.log("Promise 생성");

  return new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(Error("네트워크 오류"));
    }, 100);
  });
});

const exit = await Effect.runPromiseExit(program);
const tag = exit._tag;

console.log({ tag });

if (tag === "Failure") {
  console.log(exit.cause);
}
