# Effect로 배우는 함수형 TypeScript

이 저장소는 [Effect](https://effect.website/)를 사용해 함수형 프로그래밍의 핵심 개념을 실제 TypeScript 코드로 익히기 위한 학습 공간입니다.

## 학습 목표

학습을 마치면 다음 질문에 타입으로 답할 수 있는 프로그램을 만드는 것이 목표입니다.

1. 성공하면 어떤 값을 반환하는가?
2. 어떤 실패가 발생할 수 있는가?
3. 실행하기 위해 어떤 서비스가 필요한가?

Effect는 이 정보를 다음 타입으로 표현합니다.

```ts
Effect<Success, Error, Requirements>;
```

## 1. Effect 값을 만들고 실행하기

Effect는 작업을 즉시 실행하지 않고, 실행할 프로그램을 값으로 묘사합니다.

먼저 다음 생성 함수의 차이를 익힙니다.

- `Effect.succeed`: 이미 존재하는 성공 값
- `Effect.fail`: 예상 가능한 실패
- `Effect.sync`: 실행 시점까지 지연할 동기 작업
- `Effect.try`: 예외가 발생할 수 있는 동기 작업
- `Effect.promise`: 실패하지 않는 Promise 작업
- `Effect.tryPromise`: 실패할 수 있는 Promise 작업

```ts
import { Effect } from "effect";

const parseJson = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input),
    catch: () => new Error("잘못된 JSON입니다"),
  });

const program = parseJson('{"name":"Alex"}');

Effect.runPromise(program);
```

### 체크리스트

- [ ] Effect를 만드는 것과 실행하는 것의 차이를 설명할 수 있다.
- [ ] `sync`와 `try`, `promise`와 `tryPromise`를 구분할 수 있다.
- [ ] `runPromise`를 애플리케이션 경계에서만 호출한다.

참고: [The Effect Type](https://effect.website/docs/v4/getting-started/the-effect-type), [Creating Effects](https://effect.website/docs/v4/getting-started/creating-effects)

## 2. Effect 합성하기

작은 Effect를 조합해 하나의 프로그램을 만듭니다. 처음에는 읽기 쉬운 `Effect.gen`을 중심으로 연습합니다.

```ts
import { Effect } from "effect";

const fetchUser = (id: number) =>
  Effect.tryPromise({
    try: () =>
      fetch(`https://example.com/users/${id}`).then((response) =>
        response.json(),
      ),
    catch: () => new Error("사용자 조회 실패"),
  });

const program = Effect.gen(function* () {
  const user = yield* fetchUser(1);
  yield* Effect.log(`사용자: ${user.name}`);
  return user;
});
```

함께 연습할 API:

- `Effect.map`
- `Effect.flatMap`
- `Effect.andThen`
- `Effect.gen`
- `pipe`

### 연습

같은 프로그램을 `Effect.gen`과 `Effect.flatMap`으로 각각 작성하고 두 방식이 어떻게 대응하는지 비교합니다.

### 체크리스트

- [ ] `yield*`가 여러 Effect를 하나의 Effect로 합성한다는 것을 이해한다.
- [ ] 중간 단계에서 `runPromise`를 호출하지 않는다.
- [ ] 작은 Effect를 조합해 하나의 업무 흐름을 만들 수 있다.

## 3. 타입이 지정된 오류 다루기

Effect는 오류를 두 종류로 구분합니다.

- **예상된 오류**: 잘못된 입력, 존재하지 않는 사용자, 인증 실패처럼 정상적인 업무 흐름에 포함되는 실패
- **Defect**: 버그, 깨진 불변식, 발생하면 안 되는 예외

예상된 오류는 Effect의 오류 타입에 나타나야 합니다.

```ts
import { Data, Effect } from "effect";

class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly id: number;
}> {}

const findUser = (id: number) =>
  id === 1
    ? Effect.succeed({ id, name: "Alex" })
    : Effect.fail(new UserNotFound({ id }));
```

학습할 내용:

- tagged error
- `Effect.catch`
- `Effect.catchTag`와 `Effect.catchTags`
- 오류 변환과 fallback
- retry와 timeout
- `Exit`와 `Cause`의 기본 개념

### 체크리스트

- [ ] 예상된 오류를 일반적인 `Error` 하나로 뭉치지 않는다.
- [ ] 오류 타입만 보고 가능한 실패를 파악할 수 있다.
- [ ] defect를 도메인 로직에서 무리하게 복구하지 않는다.

참고: [Two Types of Errors](https://effect.website/docs/v4/error-management/two-error-types), [Error Management](https://effect.website/docs/v4/error-management/expected-errors)

## 4. 외부 데이터를 Schema로 검증하기

네트워크 응답, 환경 변수, 사용자 입력처럼 애플리케이션 외부에서 들어오는 값은 신뢰하지 않습니다. 타입 단언 대신 Schema로 검증한 뒤 도메인 로직에 전달합니다.

학습할 내용:

- `Option`과 `Result`
- `Schema`를 이용한 파싱과 검증
- 외부 API 응답 타입과 도메인 타입 분리
- transformation
- branded type

### 연습

- [ ] 이메일 주소를 검증한다.
- [ ] 환경 변수를 애플리케이션 설정으로 변환한다.
- [ ] API의 JSON 응답을 검증한다.
- [ ] 문자열 ID를 검증된 도메인 ID로 변환한다.

참고: [Schema 가이드](https://effect.website/docs/v4/schema/introduction)

## 5. Service와 Layer로 의존성 관리하기

업무 로직이 데이터베이스나 외부 API 구현체를 직접 가져오지 않도록 설계합니다. 프로그램이 필요로 하는 능력을 서비스로 표현하고, 실행할 때 Layer로 구현을 제공합니다.

```text
업무 프로그램
 ├─ UserRepository 필요
 ├─ HttpClient 필요
 ├─ Clock 필요
 └─ Logger 필요
```

학습 순서:

1. 서비스 인터페이스를 정의한다.
2. Effect 안에서 서비스를 사용한다.
3. 실제 구현을 Layer로 제공한다.
4. 테스트용 구현으로 교체한다.
5. 여러 Layer를 조합한다.
6. Layer의 생명주기와 memoization을 이해한다.

### 체크리스트

- [ ] 업무 로직이 구체적인 구현체를 직접 import하지 않는다.
- [ ] 필요한 서비스가 `Requirements` 타입에 나타난다.
- [ ] 외부 시스템 없이 테스트할 수 있는 Layer를 제공한다.

참고: [Managing Services](https://effect.website/docs/v4/requirements-management/services), [Managing Layers](https://effect.website/docs/v4/requirements-management/layers)

## 6. 자원과 동시성 다루기

Effect의 구조화된 동시성을 이용해 병렬 작업과 자원의 생명주기를 안전하게 관리합니다.

학습할 내용:

- `Scope`
- acquire/use/release
- Fiber와 interruption
- 순차 실행과 병렬 실행
- 제한된 동시성
- race
- retry와 `Schedule`
- `Queue`, `Deferred`, `Semaphore`

### 연습

URL 20개를 다음 조건으로 요청하는 프로그램을 작성합니다.

- 동시에 최대 4개만 요청한다.
- 실패하면 지수 백오프로 재시도한다.
- 전체 작업의 제한 시간은 10초다.
- 프로그램이 중단되면 진행 중인 작업과 자원을 정리한다.

### 체크리스트

- [ ] 단순한 `Promise.all`과 구조화된 동시성의 차이를 설명할 수 있다.
- [ ] 작업 취소 시 자식 Fiber가 어떻게 처리되는지 이해한다.
- [ ] 자원 획득과 해제가 성공·실패 여부와 관계없이 보장된다.

참고: [Basic Concurrency](https://effect.website/docs/v4/getting-started/basic-concurrency), [Resource Management](https://effect.website/docs/v4/resource-management/introduction)

## 7. 테스트와 운영 기능 적용하기

마지막으로 실제 서비스 운영에 필요한 기능을 학습합니다.

- 테스트용 Layer
- `TestClock`
- 구조화된 로깅
- metrics와 tracing
- configuration
- Stream과 backpressure
- caching과 batching

시간 기반 로직은 실제 시간을 기다리지 않고 `TestClock`으로 검사합니다.

```text
3초 후 재시도
 → 테스트에서 실제로 3초를 기다리지 않음
 → TestClock으로 가상 시간을 진행
```

Stream은 기본 Effect, 오류 처리, 자원 관리, 동시성을 익힌 다음 학습합니다.

참고: [Testing](https://effect.website/docs/v4/testing/testclock), [Observability](https://effect.website/docs/v4/observability/logging), [Stream](https://effect.website/docs/v4/stream/introduction)

## 실습 프로젝트: GitHub 저장소 정보 조회 CLI

각 단계를 별도의 토이 프로젝트로 만들기보다 하나의 프로그램을 계속 발전시킵니다.

1. 저장소 이름을 입력받는다.
2. GitHub API를 호출한다.
3. 응답을 Schema로 검증한다.
4. 네트워크·인증·저장소 없음 오류를 구분한다.
5. 여러 저장소를 제한된 동시성으로 조회한다.
6. rate limit 오류에 retry 정책을 적용한다.
7. HTTP 클라이언트를 Service로 분리한다.
8. 테스트 Layer를 만들어 네트워크 없이 검사한다.
9. 구조화된 로그와 실행 시간을 기록한다.
10. 결과를 Stream으로 출력한다.

## 학습 자료

- [Effect 공식 문서](https://effect.website/docs/v4/onboarding)
- [Effect 심화 가이드](https://effect.website/docs/v4/getting-started)
- [Effect API Reference](https://effect.website/docs/v4)
- [Effect Playground](https://effect.website/play)
