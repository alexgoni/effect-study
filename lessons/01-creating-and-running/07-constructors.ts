import { Effect } from "effect";

const succeed = Effect.succeed("성공");

const fail = Effect.fail("실패");

const number = Effect.sync(() => 1);

const jsonParseError = Effect.try(() => JSON.parse('{"name": "Alex", "age": }'));

const resolve = Effect.promise(() => new Promise<string>((resolve) => resolve("resolve")));

const reject = Effect.tryPromise(() => new Promise<string>((_, reject) => reject("reject")));
