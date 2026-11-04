# 용어 정리

학습한 개념을 자신의 언어로 정리합니다.

## Fiber

Effect runtime이 Effect 프로그램의 실행을 관리하는 가벼운 논리적 실행 단위다. 운영체제 thread나 JavaScript Worker가 아니라 runtime이 JavaScript 이벤트 루프 위에서 스케줄링한다.

Fiber는 현재 실행 상태, 완료 결과인 `Exit`, 필요한 서비스 Context, 중단 신호와 finalizer 같은 정보를 가진다. Effect 4에서는 `Effect.forkChild`로 자식 Fiber를 시작하고, `Fiber.join`으로 결과를 기다리며, `Fiber.interrupt`로 협력적으로 중단할 수 있다.

```text
Effect 프로그램
→ runtime이 Fiber에서 실행
→ 성공 또는 실패를 Exit으로 완료
```

`runSync`나 `runPromise`로 시작한 최상위 실행도 root Fiber에서 수행된다. 자식 Fiber와 자원의 수명을 부모 실행 범위에 연결하면 부모가 종료되거나 중단될 때 관련 작업과 finalizer를 함께 관리할 수 있다.

## Semaphore

동시에 공유 자원이나 특정 코드 구간에 접근할 수 있는 Fiber 수를 permit 개수로 제한하는 동시성 제어 도구다. 입구에서 permit을 획득한 Fiber만 보호 구간에 들어갈 수 있고, permit이 없으면 반환될 때까지 기다린다.

```text
permit 획득(acquire)
→ 보호 구간 실행
→ permit 반환(release)
```

permit이 1개인 Semaphore는 한 번에 하나의 Fiber만 통과시키므로 mutex처럼 동작한다. permit이 N개면 최대 N개의 Fiber가 동시에 보호 구간에 들어갈 수 있다.

Effect 4의 `TxSemaphore.withPermit`은 작업 전에 permit을 획득하고 작업이 성공, 실패, interruption 중 어떤 방식으로 끝나도 permit을 자동 반환한다. `Tx`는 permit 상태 변경을 원자적으로 관리하는 transactional semaphore라는 의미다.

## Permit

Semaphore가 보호하는 구간에 들어갈 수 있는 권한을 나타내는 논리적 통행권이다. 실제 객체를 Fiber에 넘긴다기보다 Semaphore 내부의 사용 가능한 개수를 감소·증가시키는 방식으로 관리한다.

```text
초기 permit: 2
Fiber A acquire → 남은 permit 1
Fiber B acquire → 남은 permit 0
Fiber C acquire → permit이 없어 대기
Fiber A release → 남은 permit 1, Fiber C 진입 가능
```

## Critical section

동시에 너무 많은 작업이 들어가면 안 되는 보호 대상 코드 구간이다. 데이터베이스 연결, 파일 쓰기, 공유 mutable state, 호출 수가 제한된 외부 API 접근 등이 예다. Semaphore의 permit은 전체 Fiber가 아니라 이 구간에 들어가는 동시 작업 수만 제한한다.

## Span

Tracing에서 하나의 작업이 시작해서 끝날 때까지의 실행 구간을 나타내는 기록이다. 이름, 시작·종료 시각, 성공·실패·중단 결과, 업무 속성, 부모·자식 관계 등을 담는다.

```text
process-order
├── find-user
├── check-stock
└── request-payment
```

`Effect.withSpan`은 Effect의 실행을 Span으로 감싸고 종료 결과와 함께 Span을 자동으로 닫는다. `Effect.currentSpan`은 현재 활성 Span을 얻고, `Effect.annotateCurrentSpan`은 주문 ID 같은 검색 가능한 정보를 붙인다. Fiber가 작업을 실행하는 단위라면 Span은 그 작업의 특정 구간을 관찰하기 위한 기록이다.

## Stream

시간에 따라 0개 이상의 값을 방출하고 정상 종료하거나 실패할 수 있는 프로그램이다. 배열이 이미 준비된 값들의 자료구조라면 Stream은 값의 생성, 변환, 소비, 오류와 종료 과정을 실행 전에 조합한다.

```text
값 방출   다음 값을 소비자에게 전달
정상 종료 더 이상 값이 없음
실패      오류 채널의 값과 함께 중단
```

`runCollect`은 모든 값을 배열로 모으지만 전체 Stream이 성공해야 결과를 얻는다. `runForEach`는 값을 모으지 않고 방출되는 각 값에 Effect인 소비 함수를 실행한다.

## Backpressure

생산자가 소비자보다 빠를 때 처리 대기 중인 값이 무제한으로 쌓이지 않도록 생산 흐름을 소비 속도에 맞추는 제어 방식이다.

Effect Stream은 기본적으로 소비자가 값을 요청하는 pull 방식으로 동작한다. 소비 동시성이 `1`이면 현재 값의 처리가 끝난 뒤 다음 값을 요청하고, 동시성이 `N`이면 최대 `N`개의 처리 자리가 허용되는 범위에서 값을 가져온다.

## Cache

같은 키에 대한 작업 결과를 저장해 이후 요청에서 재사용하는 구조다. cache miss에서는 lookup을 실행해 값을 만들고 저장하며, cache hit에서는 lookup 없이 저장된 값을 반환한다. 용량, 유효 시간과 무효화 정책에 따라 저장 항목의 수명을 관리한다.

## Batching

짧은 시간에 대기 중인 여러 요청을 모아 하나의 외부 작업으로 처리하는 방식이다. Cache가 같은 키의 과거 결과를 재사용한다면 Batching은 서로 다른 요청도 동시에 모아 데이터베이스나 네트워크 호출 횟수를 줄인다.

Effect에서는 `Request`가 필요한 결과와 입력을 표현하고, `RequestResolver`가 여러 Request를 실제 결과로 바꾸며, `Effect.request`가 둘을 연결해 실행 가능한 Effect를 만든다.
