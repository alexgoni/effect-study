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
| 4    | `04-interruption-cleanup.ts` | Fiber 중단 시 finalizer 실행 확인하기      | 예정    |
| 5    | `05-parallel-all.ts`         | 순차 실행과 병렬 실행 비교하기             | 예정    |
| 6    | `06-concurrency-limit.ts`    | 동시에 실행할 작업 수 제한하기             | 예정    |
| 7    | `07-race.ts`                 | 여러 작업을 경쟁시키고 승자 선택하기       | 예정    |
| 8    | `08-deferred-and-queue.ts`   | Fiber 사이에 신호와 값을 전달하기          | 예정    |
| 9    | `09-semaphore.ts`            | 공유 자원 접근 개수 제한하기               | 예정    |

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

## 완료 조건

- [ ] 자원이 성공·실패·중단 상황에서 언제 정리되는지 설명할 수 있다.
- [ ] Fiber를 생성하고 join하거나 interrupt할 수 있다.
- [ ] 작업을 순차, 병렬, 제한된 동시성으로 실행할 수 있다.
- [ ] race에서 패배한 Fiber의 처리 방식을 설명할 수 있다.
- [ ] Deferred, Queue, Semaphore의 역할을 구분할 수 있다.

## 참고

- [Resource Management](https://effect.website/docs/v4/resource-management/introduction)
- [Basic Concurrency](https://effect.website/docs/v4/getting-started/basic-concurrency)
