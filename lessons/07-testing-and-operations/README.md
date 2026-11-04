# 07. 테스트와 운영 기능

테스트, 로깅, 설정, Stream 등 운영에 필요한 기능을 학습합니다.

## 학습 목표

- 외부 시스템 없이 업무 프로그램을 테스트한다.
- 시간 기반 Effect를 실제 대기 없이 검증한다.
- 구조화된 로그와 설정을 Effect 프로그램에 연결한다.
- 여러 값을 Stream으로 처리하고 backpressure를 이해한다.
- 반복 계산과 요청을 cache 및 batching으로 최적화한다.

## 학습 내역

| 순서 | 파일 | 내용 | 상태 |
| --- | --- | --- | --- |
| 1 | `01-test-layer.ts` | 테스트 Layer로 서비스 구현 교체하기 | 완료 |
| 2 | `02-test-clock.ts` | 가상 시간으로 sleep과 timeout 테스트하기 | 완료 |
| 3 | `03-structured-logging.ts` | 로그 레벨과 annotation 사용하기 | 완료 |
| 4 | `04-config.ts` | 설정값을 typed error와 함께 읽기 | 완료 |
| 5 | `05-metrics-and-tracing.ts` | metrics와 span으로 실행 관찰하기 | 완료 |
| 6 | `06-stream.ts` | 여러 값을 Stream으로 처리하기 | 예정 |
| 7 | `07-backpressure.ts` | 생산자와 소비자의 속도 차이 다루기 | 예정 |
| 8 | `08-cache-and-batching.ts` | 반복 작업을 cache하고 요청 합치기 | 예정 |

## 01. 테스트 Layer

업무 프로그램은 서비스 계약에만 의존하고, 테스트에서는 `Layer.succeed`로 결정적인 구현을 제공합니다. 실제 ID 생성기 대신 항상 같은 ID를 반환하는 Layer를 제공하면 외부 시스템 없이 결과를 반복 검증할 수 있습니다.

```text
createUser("test")
→ testIdGeneratorLayer 제공
→ { id: "test-id-1", name: "test" }
→ deepStrictEqual로 검증
```

`Effect.provideService`는 구현 객체를 직접 받고, `Effect.provide`는 Layer를 받습니다. Node의 `deepStrictEqual`은 객체 참조가 아니라 내부 구조와 값을 비교하며 성공하면 `void`, 실패하면 `AssertionError`를 던집니다.

## 02. TestClock

`TestClock`은 실제 시간을 기다리지 않고 `sleep` 같은 시간 기반 Effect를 검사하게 합니다. 먼저 지연 작업을 자식 Fiber로 시작한 뒤 `TestClock.adjust`로 가상 시간을 이동하고, `Fiber.join`으로 자식의 성공값을 얻습니다.

```text
지연 작업을 자식 Fiber로 시작
→ 자식이 1시간 sleep
→ TestClock을 1시간 이동
→ sleep 완료
→ Fiber.join으로 "완료" 획득
```

`TestClock.layer()`는 Effect Runtime이 기본 제공하는 실제 `Clock`을 테스트용 Clock으로 교체합니다. `Clock`은 기본 Runtime 서비스라 Effect 타입의 환경 채널 `R`에 나타나지 않으므로, 프로그램의 타입이 `Effect<string, never, never>`여도 이 Layer를 제공해야 `TestClock.adjust`를 사용할 수 있습니다.

## 03. 구조화된 로깅

`Effect.logInfo`, `Effect.logWarning`, `Effect.logError`는 로그의 심각도를 구분하며 각각 즉시 출력하는 대신 `Effect<void>`를 반환합니다. 동기적인 로그만 포함한 프로그램은 `Effect.runSync`로 실행할 수 있습니다.

`Effect.annotateLogs`로 프로그램을 감싸면 그 범위 안에서 발생하는 모든 로그에 `orderId` 같은 구조화된 부가 정보를 붙일 수 있습니다.

```text
annotateLogs(program, { orderId: "order-123" })
→ INFO  메시지 { orderId: "order-123" }
→ WARN  메시지 { orderId: "order-123" }
→ ERROR 메시지 { orderId: "order-123" }
```

로그 메시지 문자열에 식별자를 직접 조합하는 것과 달리 annotation은 데이터를 별도 필드로 유지하므로 로그 수집 도구에서 필드별 검색과 필터링에 사용할 수 있습니다.

## 04. Config

`Config`는 어떤 키를 어떤 타입으로 읽고 검증할지 설명하고, `ConfigProvider`는 원시 설정값을 제공하며, `config.parse(provider)`는 둘을 연결한 Effect를 만듭니다.

```text
Config.Port("PORT")       읽기·변환·검증 규칙
ConfigProvider            { PORT: "3000" }을 제공
→ parse                   Effect<number, ConfigError>
→ runSync                 3000
```

`"PORT"` 문자열은 Provider에서 찾을 키일 뿐이다. 정수 변환과 `1~65535` 범위 검사는 `Config.Port` 내부의 `PortSchema`에 정의되어 있습니다. 따라서 같은 키도 `Config.String`, `Config.Int`, `Config.Port` 중 무엇을 선택하는지에 따라 검증 규칙이 달라집니다.

잘못된 값은 `ConfigError`로 오류 채널에 들어갑니다. `runSyncExit`을 사용하면 예외로 종료하지 않고 `Exit.Failure → Cause.Fail → ConfigError → SchemaError` 구조와 실패한 설정 경로를 확인할 수 있습니다.

## 05. Metrics와 Tracing

Metric은 여러 실행에서 발생한 값을 집계합니다. `Metric.counter`는 Counter를 정의하고, `Metric.update`는 값을 누적하며, `Metric.value`는 현재 Counter 상태를 읽습니다. 업데이트와 조회는 모두 Effect이므로 `Effect.gen` 안에서 `yield*`로 실행해야 합니다.

Span은 한 작업의 시작부터 종료까지 실행 구간을 기록합니다. `Effect.withSpan`은 기존 프로그램을 Span으로 감싸고, 프로그램이 성공하거나 실패하면 Span도 해당 `Exit`과 함께 자동 종료합니다.

```text
process-orders Span 시작
→ orders_total Counter 갱신
→ orders.count annotation 기록
→ 프로그램 결과 반환
→ Span 종료
```

`Effect.currentSpan`으로 현재 Span을 얻고 `Effect.annotateCurrentSpan`으로 검색 가능한 업무 정보를 붙일 수 있습니다. Metric이 전체 횟수를 집계한다면 Span은 특정 실행 한 번의 시간, 결과, 부모·자식 관계를 추적합니다.

## 완료 조건

- [x] 테스트 Layer로 외부 의존성을 결정적인 값으로 교체할 수 있다.
- [x] `TestClock`으로 실제 시간을 기다리지 않고 시간 기반 로직을 검사할 수 있다.
- [x] 구조화된 로그와 Config를 프로그램에 적용할 수 있다.
- [ ] Stream의 성공값, 오류, 종료를 설명할 수 있다.
- [ ] backpressure, cache, batching이 해결하는 문제를 구분할 수 있다.

## 참고

- [Testing](https://effect.website/docs/v4/testing/testclock)
- [Observability](https://effect.website/docs/v4/observability/logging)
- [Stream](https://effect.website/docs/v4/stream/introduction)
