import { Effect } from "effect";

const program = Effect.gen(function* () {
  yield* Effect.logInfo("주문 처리 시작");
  yield* Effect.logWarning("재고가 부족합니다");
  yield* Effect.logError("주문 처리 실패");

  return "완료";
});

console.log(
  Effect.runSync(Effect.annotateLogs(program, { orderId: "order-123" })),
);
