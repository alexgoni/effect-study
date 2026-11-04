import { Effect, Metric } from "effect";

const counter = Metric.counter("orders_total");

const program = Effect.gen(function* () {
  yield* Metric.update(counter, 1);
  yield* Metric.update(counter, 1);

  const value = yield* Metric.value(counter);
  const span = yield* Effect.currentSpan;

  yield* Effect.annotateCurrentSpan("orders.count", value.count);
  const recordedCount = span.attributes.get("orders.count");

  return { value: value.count, spanName: span.name, recordedCount };
});

console.log(Effect.runSync(Effect.withSpan(program, "process-orders")));
