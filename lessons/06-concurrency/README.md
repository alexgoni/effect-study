# 06. 동시성과 자원 관리

구조화된 동시성과 안전한 자원 생명주기를 학습합니다.

## 학습 목표

- 성공, 실패, 중단 여부와 관계없이 자원을 안전하게 정리한다.
- Fiber를 생성하고 완료를 기다리거나 중단할 수 있다.
- 순차 실행과 병렬 실행을 구분하고 동시 실행 개수를 제한한다.
- 여러 작업의 경쟁과 Fiber 사이의 값 전달을 다룬다.
- 공유 자원에 동시에 접근하는 작업 수를 제어한다.

## 학습 내역

| 순서 | 파일                         | 내용                                       | 상태    |
| ---- | ---------------------------- | ------------------------------------------ | ------- |
| 1    | `01-acquire-use-release.ts`  | 자원 획득·사용·해제를 하나의 Effect로 묶기 | 완료    |
| 2    | `02-scoped-resource.ts`      | Scope에 자원 생명주기 연결하기             | 완료    |
| 3    | `03-fork-and-join.ts`        | Fiber 생성과 완료 기다리기                 | 완료    |
| 4    | `04-interruption-cleanup.ts` | Fiber 중단 시 finalizer 실행 확인하기      | 완료    |
| 5    | `05-parallel-all.ts`         | 순차 실행과 병렬 실행 비교하기             | 완료    |
| 6    | `06-race.ts`                 | 여러 작업을 경쟁시키고 승자 선택하기       | 완료    |
| 7    | `07-deferred-and-queue.ts`   | Fiber 사이에 신호와 값을 전달하기          | 완료    |
| 8    | `08-semaphore.ts`            | 공유 자원 접근 개수 제한하기               | 완료    |

## 01. `acquireUseRelease`

`Effect.acquireUseRelease`는 자원 획득, 사용, 해제를 하나의 Effect로 묶는 Effect식 `try/finally`입니다. 자원 획득이 성공하면 사용 단계가 성공, 실패, interruption 중 어떤 방식으로 끝나더라도 해제 Effect가 실행됩니다.

```text
acquire 성공
→ use 실행
→ release 실행
→ use의 성공값 또는 실패를 최종 결과로 전달
```

## 02. `acquireRelease`와 `Scope`

`Effect.acquireRelease`는 자원을 획득하고 해제 finalizer를 현재 Scope에 등록합니다. 반환된 자원 Effect의 Requirements에는 `Scope`가 남으며, `Effect.scoped`가 Scope를 제공하고 내부 프로그램 종료 시 등록된 finalizer를 실행합니다.

```text
Effect<Connection, never, Scope>
→ Effect.scoped
→ Effect<string, never, never>
```

`Effect.scoped`는 finalizer 실행까지 마친 다음 내부 프로그램의 성공값을 반환합니다. 따라서 바깥 runner가 결과를 반환하기 전에 자원 해제가 완료됩니다.

## 03. `forkChild`와 `Fiber.join`

`Effect.forkChild`는 Effect를 부모와 별개의 자식 Fiber로 등록하고 Fiber handle을 즉시 반환합니다. 기본 설정에서는 현재 부모 Fiber가 실행권을 유지하며, 부모가 비동기 대기나 `Fiber.join`에서 중단되면 scheduler가 자식 Fiber를 진행할 수 있습니다.

```text
forkChild → 자식 Fiber 생성 및 스케줄링
Fiber.join → 자식 완료를 기다리고 성공값 받기
```

부모가 50ms 대기하고 자식이 100ms 대기하는 작업을 fork하면 두 대기 시간이 겹쳐 전체 실행 시간은 합계인 약 150ms가 아니라 약 100ms가 됩니다. Fiber 동시성은 JavaScript 코드를 여러 CPU core에서 동시에 실행한다는 뜻이 아니라, 한 Fiber가 비동기 대기 중일 때 다른 Fiber를 진행시키는 구조입니다.

## 04. Fiber interruption과 cleanup

`Fiber.interrupt`는 자식 Fiber에 중단을 요청하고, 자식에 등록된 finalizer가 모두 끝날 때까지 기다립니다. 따라서 interruption 시에는 use의 남은 작업은 건너뛰지만 `acquireUseRelease`의 release는 실행됩니다.

```text
자원 획득
→ 작업 시작
→ 중단 요청
→ 자원 해제
→ 중단 완료
```

`Fiber.interrupt` 다음 작업이 release 이후에 실행되는 순서로 cleanup 완료까지 기다린다는 사실을 확인할 수 있습니다. interruption은 예상 오류 타입 `E`가 아니라 Fiber의 종료 Cause로 관리됩니다.

## 05. `Effect.all`의 동시성

`Effect.all`은 기본적으로 입력 Effect를 순차 실행하며, `{ concurrency: "unbounded" }`를 지정하면 각각을 동시 진행합니다. 300ms, 200ms, 100ms 작업의 순차 실행은 약 600ms, 동시 실행은 가장 긴 작업에 가까운 약 300ms가 걸렸습니다.

```text
순차 실행 시간 ≈ 300 + 200 + 100
동시 실행 시간 ≈ max(300, 200, 100)
```

동시 실행에서는 완료 순서가 `C → B → A`여도 `Effect.all`의 결과 배열은 입력 순서인 `[A, B, C]`를 유지합니다. `runPromise`의 Promise를 `await`하지 않고 시간을 재면 작업 완료 전의 시간이 측정되고 결과도 pending Promise이므로, 전체 실행 시간은 반드시 `await` 이후에 계산합니다.

## 06. `Effect.race`

`Effect.race`는 두 Effect를 동시에 실행해 먼저 성공한 값을 반환하고, 나머지 Fiber를 interruption 합니다. 100ms 작업과 300ms 작업을 경쟁시키면 약 100ms에 빠른 작업의 결과가 반환되고 느린 작업의 완료 부분은 실행되지 않습니다.

```text
fast 성공
→ slow Fiber 중단
→ fast 성공값 반환
```

먼저 실패한 작업은 승자가 아니므로 다른 작업의 성공을 계속 기다립니다. 성공과 실패를 구분하지 않고 먼저 완료된 결과를 선택하려면 `raceFirst`가 필요합니다.

## 07. `Deferred`와 `Queue`

`Deferred`는 한 번만 완료되는 값을 여러 Fiber가 기다릴 수 있게 합니다. `Deferred.await`은 값이 없으면 현재 Fiber만 중단하고, 다른 Fiber가 `Deferred.succeed`로 완료하면 기다리던 Fiber가 재개됩니다.

`Queue`는 여러 값을 FIFO 순서로 전달합니다. `Queue.offer`는 값을 넣는 Effect이고 `Queue.take`는 값을 하나 제거하며 받는 Effect입니다. 두 API의 반환값도 Effect이므로 `yield*`로 실행 흐름에 합성해야 합니다.

```text
Deferred → 한 번의 완료 신호 또는 결과 공유
Queue    → 여러 값을 순서대로 생산·소비
```

## 08. `TxSemaphore`

Semaphore는 permit 개수로 특정 공유 구간에 동시에 들어갈 수 있는 Fiber 수를 제한합니다. permit이 1개이면 작업 전체는 동시 진행할 수 있어도 `withPermit`으로 감싼 보호 구간에는 한 Fiber만 진입합니다.

```text
일반 작업: A, B, C 동시 진행 가능
보호 구간: A 종료 → B 진입 → B 종료 → C 진입
```

`TxSemaphore.withPermit`은 보호 Effect가 성공, 실패, interruption 중 어떤 방식으로 종료돼도 permit을 자동 반환합니다. `Effect.all`의 concurrency는 특정 작업 묶음 전체를 제한하지만 Semaphore는 프로그램 여러 곳에서 공유되는 특정 자원 또는 critical section을 제한합니다.




## 완료 조건

- [x] 자원이 성공·실패·중단 상황에서 언제 정리되는지 설명할 수 있다.
- [x] Fiber를 생성하고 join하거나 interrupt할 수 있다.
- [x] 작업을 순차, 병렬, 제한된 동시성으로 실행할 수 있다.
- [x] race에서 패배한 Fiber의 처리 방식을 설명할 수 있다.
- [x] Deferred, Queue, Semaphore의 역할을 구분할 수 있다.

## 참고

- [Resource Management](https://effect.website/docs/v4/resource-management/introduction)
- [Basic Concurrency](https://effect.website/docs/v4/getting-started/basic-concurrency)
