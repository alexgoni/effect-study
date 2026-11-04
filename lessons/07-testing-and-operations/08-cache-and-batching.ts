import { Cache, Effect, Request, RequestResolver } from "effect";

let lookupCount = 0;

const program = Effect.gen(function* () {
  const cache = yield* Cache.make({
    capacity: 10,
    lookup: (key: string) =>
      Effect.sync(() => {
        lookupCount++;
        return key.toUpperCase();
      }),
  });

  const first = yield* Cache.get(cache, "effect");
  const second = yield* Cache.get(cache, "effect");

  return { first, second, lookupCount };
});

console.log(Effect.runSync(program));

// ----------------------------------------------

interface GetUserName extends Request.Request<string> {
  readonly _tag: "GetUserName";
  readonly id: number;
}

const GetUserName = Request.tagged<GetUserName>("GetUserName");

const batchSizes: number[] = [];

const resolver = RequestResolver.fromFunctionBatched<GetUserName>((entries) => {
  batchSizes.push(entries.length);

  return entries.map((entry) => `user-${entry.request.id}`);
});

const getUserName = (id: number) => {
  const request = GetUserName({ id });

  return Effect.request(request, resolver);
};

const batchProgram = Effect.all(
  [getUserName(1), getUserName(2), getUserName(3)],
  {
    concurrency: "unbounded",
  },
);

const results = await Effect.runPromise(batchProgram);

console.log({
  results,
  batchSizes,
});
