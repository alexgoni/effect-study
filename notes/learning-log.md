# 학습 기록

## Effect와 program의 의미

```ts
const program = Effect.succeed("Hello, Effect!");
```

### Effect

`Effect`는 문맥에 따라 다음을 가리킨다.

1. `Effect.succeed`, `Effect.runPromise` 같은 함수를 제공하는 모듈
2. `Effect.Effect<Success, Error, Requirements>` 형태의 타입
3. 실행할 계산을 설명하는 Effect 값

`Effect.succeed("Hello, Effect!")`는 문자열 결과를 즉시 꺼내는 것이 아니라, 실행하면 해당 문자열로 성공할 계산을 값으로 만든다.

```ts
Effect.Effect<string, never, never>;
//            성공값  오류   의존성
```

- `string`: 실행하면 문자열로 성공한다.
- 첫 번째 `never`: 예상된 실패가 없다.
- 두 번째 `never`: 실행에 필요한 외부 서비스가 없다.

### program

`program`은 TypeScript나 Effect의 키워드가 아니라 변수 이름이다. Effect에서는 여러 작업을 합성한 최종 실행 계획을 하나의 값으로 만들기 때문에 관례적으로 `program`이라는 이름을 자주 사용한다.

작은 Effect에는 `greeting`, `helloEffect`처럼 역할이 드러나는 이름을 사용할 수도 있다.

## 함수형 프로그래밍과의 연결

함수형 프로그래밍에서는 프로그램도 하나의 값으로 다룬다. 작업을 즉시 실행하지 않고 먼저 값으로 묘사한 뒤, 이를 조합하고 프로그램의 경계에서 실행한다.

```text
Effect 값 만들기       Effect 조합하기       Effect 실행하기
     순수                  순수                외부 세계
      │                     │                     │
      └──── 프로그램을 값으로 표현 ────────────────┘
```

### 프로그램을 값으로 다루기

Effect 값은 일반적인 데이터처럼 함수에 전달하거나 함수에서 반환할 수 있다. 실행하기 전에 다른 Effect와 합성하거나 retry, timeout 같은 동작을 추가할 수도 있다.

### 설명과 실행 분리하기

함수형 프로그래밍은 부수 효과를 무조건 없애기보다 발생 위치를 통제한다.

- 프로그램 내부에서는 무엇을 할지 값으로 설명한다.
- 애플리케이션 경계에서는 Effect runtime을 통해 설명한 프로그램을 실행한다.

`Effect.runPromise(program)`은 Effect 값을 실제로 실행하는 경계에 해당한다.

### 불변성과 합성

기존 Effect에 새로운 동작을 적용해도 원래 Effect를 변경하지 않는다. 대신 새로운 Effect 값을 반환한다. 이 특성 덕분에 작은 프로그램을 안전하게 조합해 더 큰 프로그램을 만들 수 있다.

### 부수 효과를 타입으로 드러내기

일반적인 `Promise<string>`은 주로 성공 값만 표현하지만, Effect는 성공 값과 예상된 실패, 필요한 의존성을 함께 표현한다. 따라서 프로그램의 동작을 타입만으로 더 명시적으로 파악할 수 있다.

## 핵심 정리

> 작업을 바로 실행하지 않고 값으로 만든 뒤, 조합 가능한 상태로 유지하다가 프로그램의 경계에서 실행한다.

## Effect runtime

Effect runtime은 Effect 객체로 만든 프로그램을 해석하고 실제로 실행하는 실행 엔진이다.

```text
Effect 객체 = 실행 계획
Effect runtime = 계획을 읽고 실행하는 엔진
```

`Effect.sync` 같은 생성 함수는 실행할 작업을 Effect 객체로 만든다. `Effect.runSync`와 `Effect.runPromise`는 이 객체를 runtime에 전달하는 실행 진입점이다.

```text
runSync / runPromise
        ↓
Effect runtime 시작
        ↓
Effect 객체 해석
        ↓
성공 값 또는 실패 결과 생성
```

Effect runtime은 프로그램이 커지면 다음 작업도 담당한다.

- Effect의 실행 순서와 성공·실패 처리
- Fiber 생성과 스케줄링
- 필요한 Service 제공
- 동시 실행과 interruption 관리
- 자원의 획득과 해제
- 로깅과 tracing

Effect runtime은 JavaScript runtime과 같은 것이 아니다. Node.js와 V8이 제공하는 JavaScript runtime 위에 Effect 라이브러리가 구현한 실행 시스템이다.

```text
Node.js / JavaScript runtime
└─ Effect runtime
   └─ Effect program
```

## Effect의 오류 채널

오류 채널은 실제 큐나 별도의 통신 객체가 아니라, Effect가 예상된 실패를 성공 값과 분리해 표현하고 전달하는 논리적인 경로다.

```ts
Effect.Effect<Success, Error, Requirements>;
//            성공 채널 오류 채널
```

Effect 프로그램은 실행 결과를 두 경로로 전달할 수 있다.

```text
Effect 실행
├─ 성공 → Success 값
└─ 실패 → Error 값
```

`Effect.succeed`는 성공 채널에 값을 만들고, `Effect.fail`은 오류 채널에 값을 만든다. 오류 채널의 값은 처리 함수가 만날 때까지 다음 Effect로 전파된다.

```ts
Effect.Effect<never, string, never>;
//                   ^^^^^^
//                   오류 채널의 값 타입
```

오류 채널은 예상하고 복구할 수 있는 실패를 위한 것이다. 코드 버그나 깨진 불변식에서 발생하는 defect는 typed error 채널과 구분되며 `Cause`에서 함께 추적된다.

`Exit`으로 실행 결과를 꺼내면 두 경로가 값으로 드러난다.

```text
Exit.Success(value)
Exit.Failure(cause)
```

## `tryPromise`와 `UnknownError`

`Effect.tryPromise`의 기본 오류 타입인 `UnknownError`는 `reject`에 전달한 값을 분석해서 추론한 타입이 아니다. Promise의 rejection 타입을 알 수 없을 때 `tryPromise`가 기본으로 제공하는 오류 타입이다.

```ts
Promise<string>;
//      ^^^^^^ resolve되는 성공 값의 타입만 표현
```

TypeScript의 `Promise<T>`에는 reject 타입을 나타내는 타입 매개변수가 없다. 같은 `Promise<string>`도 `Error`, 문자열, 숫자 등 어떤 값으로든 reject될 수 있으므로 Effect는 기본적으로 rejection을 `UnknownError`로 감싼다.

```text
Effect.tryPromise(() => Promise<string>)
                       │
                       ├─ 성공 타입 string은 Promise에서 추론
                       └─ 오류 타입 UnknownError는 tryPromise가 제공
```

`tryPromise`에 `try`와 `catch`를 함께 제공하면 `catch`가 반환하는 값에서 구체적인 오류 타입을 추론할 수 있다.

```text
catch가 NetworkError 반환
→ Effect<string, NetworkError, never>
```

## `map`은 어떻게 Effect를 연결하는가

`map`을 연속해서 사용하는 모습은 메서드 체이닝과 비슷하지만, 핵심은 기존 Effect를 변경하는 것이 아니라 이전 Effect와 변환 함수를 참조하는 새로운 Effect를 만드는 것이다.

```text
source Effect
    ↓ map(f)
source와 f를 기억하는 새 Effect
    ↓ map(g)
이전 Effect와 g를 기억하는 새 Effect
```

`Effect.map(source, f)`를 호출하는 시점에는 `source`와 함수 `f`를 새 Effect에 저장할 뿐, 둘을 실행하지 않는다.

Effect runtime이 합성된 Effect를 실행하면 먼저 `source`를 실행한다. `source`가 값 `A`로 성공하면 runtime이 저장해 둔 함수를 일반적인 JavaScript 함수 호출인 `f(A)` 형태로 직접 호출한다. 이 함수 호출로 `A`가 `f`의 첫 번째 매개변수에 바인딩된다.

```text
Effect.map(source, f)
    ↓ source와 f를 저장
runtime이 source 실행
    ↓ A로 성공
runtime이 f(A) 호출
    ↓ B 반환
합성된 Effect가 B로 성공
```

예를 들어 `source`가 `10`으로 성공하고 저장된 함수가 `multiply2AndString`이라면 runtime이 실제로 호출하는 형태는 `multiply2AndString(10)`이다.

`source`가 실패하면 성공 값을 얻지 못하므로 `f`를 호출하지 않고 실패를 그대로 전달한다.

### Effect 4 내부 구현

Effect 4에서 `map`은 다음과 같이 `ContImpl`을 만든다.

```ts
new ContImpl(self, mapCont, f);
```

- `self`: 먼저 실행할 원본 Effect
- `mapCont`: 원본 Effect가 성공한 뒤 실행할 내부 continuation
- `f`: 사용자가 `map`에 전달한 변환 함수

`ContImpl`은 `self`와 `f`를 내부에 저장한다. runtime은 `self`를 먼저 실행하고, 성공 값을 얻으면 저장해 둔 `mapCont`를 호출한다.

`mapCont`의 실제 구현은 성공 값 `value`를 전달받아 `payload`에 저장된 `f`를 호출한다.

```ts
const mapCont = function (this: { readonly payload: any }, value: any, fiber: FiberImpl) {
  const f = this.payload;
  return fiber.succeedWith(continuationMarksStack ? f(value) : internalCall(() => f(value)));
};
```

여기서 `this.payload`는 `new ContImpl(self, mapCont, f)`를 만들 때 저장한 함수 `f`이고, `value`는 `self`의 성공 값이다. 스택 추적을 위한 분기를 제외하면 핵심은 `f(value)`이며, 그 반환값을 `fiber.succeedWith`에 전달해 다음 성공 값으로 만든다.

```text
new ContImpl(source, mapCont, multiply2AndString)
                            ↓ payload에 함수 저장

source가 10으로 성공
→ mapCont(value = 10) 호출
→ f = this.payload
→ f(value)
→ multiply2AndString(10)
```

따라서 `map`은 실행 결과를 즉시 꺼내는 함수가 아니라 성공 이후에 실행할 변환 단계를 프로그램 설명에 연결하는 합성 함수다. `Effect.map(source, f)`, `source.pipe(Effect.map(f))`, `pipe(source, Effect.map(f))`는 표현 방식만 다르고 같은 연결을 만든다.

### data-first와 data-last를 모두 지원하는 이유

data-first는 Effect 하나를 직접 변환할 때 호출 관계가 명시적이다.

```ts
Effect.map(source, f);
```

data-last는 원본 Effect를 나중에 받을 함수가 되므로 `pipe` 안에서 합성할 수 있다.

```ts
pipe(source, Effect.map(f));
```

Effect는 직접 호출의 편의성과 함수 합성의 편의성을 모두 제공하기 위해 많은 연산을 두 방식으로 노출한다. 두 방식의 의미와 결과는 같으며, 내부에서는 `dual`이 인자 개수를 보고 같은 구현을 호출한다.

```text
인자 2개: body(source, f)
인자 1개: source => body(source, f)
```

## JavaScript generator와 `yield` 문법

generator는 실행을 중간에 멈췄다가 다시 이어갈 수 있는 함수다. 일반 함수와 달리 `function*`으로 선언하며, 호출하면 함수 본문을 즉시 끝까지 실행하는 대신 iterator를 반환한다.

```ts
function* numbers() {
  yield 1;
  yield 2;
  return 3;
}

const iterator = numbers();
```

iterator의 `next()`를 호출하면 다음 `yield` 또는 `return`까지 실행한다.

```text
iterator.next() → { value: 1, done: false }
iterator.next() → { value: 2, done: false }
iterator.next() → { value: 3, done: true }
```

- `value`: generator가 밖으로 전달한 값
- `done: false`: 아직 실행할 코드가 남아 있음
- `done: true`: `return`까지 도달해 실행이 끝남

### `yield`로 값을 주고받기

`yield value`는 `value`를 generator 바깥으로 내보내고 실행을 일시 정지한다. 다음 `next(input)` 호출의 `input`은 멈춰 있던 `yield` 표현식의 결과로 들어온다.

```ts
function* receive() {
  const input = yield "값을 주세요";
  return input;
}
```

```text
iterator.next()
→ "값을 주세요"를 밖으로 전달하고 정지

iterator.next(10)
→ yield 표현식의 결과가 10
→ input에 10이 바인딩되고 실행 재개
```

### `yield`와 `yield*`

`yield`는 값 하나를 그대로 내보낸다. `yield*`는 다른 iterable 또는 generator에 순회를 위임한다.

```ts
function* values() {
  yield* [1, 2, 3];
}
```

위 코드는 배열의 값을 차례로 `yield`하는 것과 같다. Effect는 `yield* effect` 문법을 사용할 수 있도록 iterable 규약을 제공하며, `Effect.gen`이 이 문법을 이용해 generator와 Effect runtime을 연결한다.

### Effect에서의 `yield*`와 1회성 iterator

Effect도 `[Symbol.iterator]()`를 구현한 iterable이다. 다만 배열처럼 내부 값을 여러 개 순회하기 위한 iterator가 아니다. Effect는 자기 자신을 한 번 내보내고, runtime이 돌려준 성공 값을 최종 완료 값으로 반환하는 1회성 iterator를 제공한다.

Effect 4에서는 Effect의 iterator를 다음과 같이 만든다.

```ts
[Symbol.iterator]() {
  return new SingleShotGen(this);
}
```

동작을 단순화하면 다음과 같다.

```ts
effect[Symbol.iterator] = function () {
  let first = true;

  return {
    next(successValue) {
      if (first) {
        first = false;

        return {
          value: effect,
          done: false,
        };
      }

      return {
        value: successValue,
        done: true,
      };
    },
  };
};
```

`yield* effect`는 이 iterator에 순회를 위임한다. 첫 번째 `next()`는 Effect 객체를 `Effect.gen` 실행기에 내보낸다. runtime이 그 Effect를 실행해 값 `A`로 성공하면 실행기가 `next(A)`로 iterator를 재개한다. 두 번째 호출은 `{ value: A, done: true }`를 반환하므로 `yield* effect` 표현식의 최종 결과가 `A`가 된다.

```text
yield* effect
→ effect[Symbol.iterator]()
→ SingleShotGen.next()
→ { value: effect, done: false }
→ runtime이 effect 실행
→ A로 성공
→ SingleShotGen.next(A)
→ { value: A, done: true }
→ yield* 표현식의 결과 = A
```

따라서 `Effect<A, E, R>`에 `yield*`를 사용하면 지역 변수에는 Effect 객체가 아니라 성공 타입 `A`가 들어온다.

## `Effect.gen`에서 `yield*`를 사용하는 이유

`Effect.gen`과 `yield*`는 여러 Effect의 순차 합성을 일반적인 동기 코드처럼 표현하기 위한 문법이다. 새로운 실행 기능을 추가하는 것이 아니라, 여러 `flatMap`으로 표현할 수 있는 연결을 지역 변수와 순차적인 문장으로 작성하게 해준다.

```text
flatMap(first, firstValue =>
  flatMap(second(firstValue), secondValue => ...)
)

        ↓ 같은 합성을 순차 문법으로 표현

const firstValue = yield* first
const secondValue = yield* second(firstValue)
```

### 실행 흐름

`yield* effect`를 만나면 generator가 잠시 멈추고 Effect를 runtime에 넘긴다. JavaScript가 Effect를 직접 실행하는 것이 아니라 `Effect.gen`의 실행기가 generator와 Effect runtime을 연결한다.

```text
generator 실행
→ yield* effect에서 일시 정지
→ runtime이 effect 실행
├─ 성공 A → generator를 A와 함께 재개
└─ 실패 E → generator의 다음 줄을 실행하지 않고 전체 Effect가 실패
```

성공 값 `A`는 `yield*` 표현식의 결과가 되어 지역 변수에 바인딩된다. generator의 마지막 `return` 값은 합성된 Effect의 최종 성공 값이 된다.

### `async/await`과의 차이

형태는 `async/await`과 비슷하지만 `Effect.gen`의 결과는 Promise가 아니라 `Effect<Success, Error, Requirements>`다. 따라서 실행 지연, 오류 타입, 필요한 서비스, interruption과 자원 관리 같은 Effect의 의미를 유지한다.

```text
Promise          Effect
async            Effect.gen
await            yield*
```

핵심은 순차적으로 읽히는 코드를 작성하면서도 중간에 `runSync`나 `runPromise`를 호출하지 않고, 실행 제어와 실패 처리를 Effect runtime에 남겨두는 것이다.

## 오류 타입이 있는 Effect를 `runSync`로 실행하면

`runSync`의 타입은 오류 타입 `E`가 `never`일 것을 요구하지 않는다.

```ts
runSync<A, E>(effect: Effect<A, E>): A
```

성공하면 `A`를 반환하지만 실패하면 반환하지 않고 JavaScript의 `throw` 경로로 빠져나간다. Effect 4.0.5의 구현은 먼저 `runSyncExit`으로 `Exit`을 만든 뒤, 실패하면 `causeSquash(exit.cause)`의 결과를 던진다.

```text
runSync(effect)
→ runSyncExit(effect)
├─ Success(value) → value 반환
└─ Failure(cause) → causeSquash(cause)를 throw
```

단순한 `Effect.fail("양수가 아닙니다")`의 경우 이 버전의 `causeSquash`는 오류 값인 문자열 자체를 반환하므로 `runSync`는 그 문자열을 던진다. 이 순간 오류 타입 `E`는 Effect의 typed error 채널이 아니라 JavaScript 예외 경계로 바뀐다.

`runSyncExit`을 사용하면 실패를 던지지 않고 `Exit<A, E>` 값으로 유지하므로 성공과 실패를 모두 타입이 있는 데이터로 비교할 수 있다.

## 조건문에서 반환한 Effect가 유니온으로 추론되는 이유

함수의 분기마다 서로 다른 Effect를 반환하면 TypeScript는 각 `return` 표현식의 타입을 그대로 합쳐 함수 반환 타입을 유니온으로 추론한다.

```text
성공 분기 → Effect<number, never, never>
실패 분기 → Effect<never, InvalidQuantity, never>

추론 결과
→ Effect<number, never, never> | Effect<never, InvalidQuantity, never>
```

이는 Effect 프로그램이 두 개로 나뉘어 실행된다는 뜻이 아니다. 두 분기 모두 다음의 통합된 타입에 할당할 수 있다.

```ts
Effect.Effect<number, InvalidQuantity, never>
```

`never`는 가능한 값이 없다는 뜻이므로, 성공 Effect의 `never` 오류는 `InvalidQuantity` 오류 범위에 포함될 수 있고 실패 Effect의 `never` 성공은 `number` 성공 범위에 포함될 수 있다. 함수의 반환 타입을 명시하면 이 통합된 인터페이스를 드러낼 수 있다.

## 실패 결과에는 여러 단계의 `_tag`가 있다

`runSyncExit`의 결과에서 바로 보이는 `_tag: "Failure"`는 도메인 오류의 태그가 아니라 `Exit`가 실패했다는 태그다. 실제 typed error는 실패 원인을 표현하는 `Cause` 안에 들어 있다.

```text
Exit.Failure
└─ Cause
   └─ Fail reason
      └─ InvalidQuantity
```

`_id`와 `_tag`의 역할은 다르다.

- `_id`: 값이 어떤 Effect 자료구조인지 나타낸다. 예: `"Exit"`, `"Cause"`
- `_tag`: 그 자료구조가 가질 수 있는 경우 중 현재 경우를 나타낸다.

`Exit<A, E>`는 개념적으로 성공 값 `A` 또는 실패 원인 `Cause<E>`를 담는다.

```ts
type Exit<A, E> =
  | Success<A>
  | Failure<Cause<E>>;
```

```text
Exit.Success → value: A
Exit.Failure → cause: Cause<E>
```

따라서 하나의 실패 결과에는 서로 역할이 다른 태그가 존재할 수 있다.

- `Failure`: 실행 결과인 `Exit`의 성공·실패 구분
- `Fail`: `Cause` 안에서 예상된 오류라는 구분
- `InvalidQuantity`: 애플리케이션이 정의한 도메인 오류 구분

실패 출력을 읽을 때는 바깥에서 안쪽으로 내려간다.

1. `Exit._tag`로 실행의 성공과 실패를 확인한다.
2. 실패라면 `cause`로 들어간다.
3. Cause의 reason 태그로 실패의 성격을 확인한다.
   - `Fail`: 오류 채널 `E`로 표현된 예상된 오류
   - `Die`: 오류 채널에 포함되지 않는 defect
   - `Interrupt`: Fiber 실행 중단
4. `Fail.error`, `Die.defect`, `Interrupt.fiberId`에서 세부 값을 읽는다.

Cause는 동시 실행 등에서 여러 실패 원인을 보존할 수 있으므로 직렬화된 출력의 `failures`는 배열이다.

예를 들어 `Effect<number, InvalidQuantity, never>`가 실패하면 타입 매개변수 `E`인 `InvalidQuantity`는 다음 위치에 대응한다.

```text
Exit.Failure
└─ cause
   └─ Fail
      └─ error: InvalidQuantity
```

따라서 다음 실패 출력은 “실행 결과가 실패했고, 원인은 예상된 오류이며, 실제 도메인 오류는 수량 `0`을 가진 `InvalidQuantity`다”라고 읽는다.

```text
Failure          → Exit의 실행 결과
Fail             → Cause 안의 원인 종류
InvalidQuantity  → 실제 도메인 오류 종류
```

## `catch`와 `orElseSucceed`의 차이

두 연산 모두 typed error가 발생했을 때 복구하지만 콜백의 반환 타입이 다르다.

```text
Effect.catch           E → Effect<B, E2, R2>
Effect.orElseSucceed   E → B
```

`catch`는 복구 과정 자체를 Effect로 만들기 때문에 다른 작업을 실행하거나, 다시 실패하거나, 추가 서비스를 요구할 수 있다. `orElseSucceed`는 오류로부터 평범한 대체 성공 값만 계산하며 반환된 Effect의 오류 채널은 `never`가 된다.

```text
catch(error => Effect.succeed(fallback))
≒ orElseSucceed(error => fallback)
```

따라서 단순한 기본값이면 `orElseSucceed`, 복구 과정에 Effect 작업이 필요하면 `catch`를 사용한다. 둘 다 기본적으로 defect와 interruption은 복구하지 않는다.

## Effect Schema와 Zod·Valibot의 관계

Effect Schema는 Zod나 Valibot처럼 런타임의 `unknown` 값을 검증하고, 성공한 값의 TypeScript 타입을 얻는 문제를 해결한다. 따라서 외부 입력 검증 용도에서는 대안으로 사용할 수 있다.

다만 단순한 drop-in replacement는 아니다. Effect Schema는 검증뿐 아니라 encoded 값과 decoded 값 사이의 양방향 변환을 모델링하고, 검증 실패를 `SchemaError`가 있는 Effect로 반환해 다른 Effect 프로그램과 합성할 수 있다.

```text
공통 영역
unknown → 런타임 검증 → 타입이 있는 값

Effect Schema의 중심 관점
Encoded 데이터 ⇄ Schema ⇄ Domain 타입
                    └─ Effect 오류 채널과 합성
```

이미 Effect를 프로그램의 중심으로 사용한다면 오류 처리와 합성이 자연스러운 Effect Schema가 잘 맞는다. 기존 프로젝트가 Zod나 Valibot 중심이면 반드시 교체해야 하는 것은 아니다.

## Schema 값에서 TypeScript 타입을 얻는 원리

Effect의 Schema 객체는 런타임 검증에 사용하는 AST와 함께 decoded 타입 `T`를 제네릭 정보로 가진다. `Type`은 이 제네릭을 TypeScript가 꺼낼 수 있도록 Schema 인터페이스에 선언된 type-level 표식이다.

단순화한 구조는 다음과 같다.

```ts
interface Schema<T> {
  readonly Type: T;
}
```

`Schema.Struct`는 각 필드 Schema의 `Type`을 mapped type으로 모아 객체 타입을 계산한다.

```ts
type StructType<Fields> = {
  readonly [Key in keyof Fields]: Fields[Key]["Type"];
};
```

따라서 `Schema.Number`의 `Type`은 `number`, `Schema.String`의 `Type`은 `string`이고, 두 필드를 가진 `UserSchema.Type`은 `{ readonly id: number; readonly name: string }`으로 계산된다.

```ts
type User = typeof UserSchema.Type;
```

여기서 `typeof`는 타입 위치에서 `UserSchema.Type` 프로퍼티의 정적 타입을 묻는다. `Type`은 실제 데이터를 담는 런타임 프로퍼티가 아니므로 런타임에서 `UserSchema.Type`을 읽으면 `undefined`다. 실제 런타임 검증 정보는 Schema의 AST에 들어 있다.

## Result·Option decoder는 언제 검증하는가

Effect decoder만 실행이 지연된다. Result와 Option decoder는 일반 동기 함수이므로 입력을 전달하는 호출 자체가 검증 실행이다.

```text
decodeUnknownEffect(schema)(input)
→ 실행할 Effect를 반환
→ runner를 호출할 때 검증

decodeUnknownResult(schema)(input)
→ 호출 즉시 검증
→ Result 값을 반환

decodeUnknownOption(schema)(input)
→ 호출 즉시 검증
→ Option 값을 반환
```

따라서 Result의 `Failure`는 TypeScript가 컴파일 시점에 결과를 추측한 것이 아니라 JavaScript 런타임에서 decoder 함수가 실제 입력을 검사해 만든 값이다.

Option은 `Some<A> | None`으로 성공 값의 존재 여부만 표현한다. `Some(value)`는 검증된 값이 있다는 뜻이고 `None`은 검증된 값이 없다는 뜻이다. Schema 검증에서 `None`은 입력이 Schema를 통과하지 못했다는 사실만 남기며, 실패 이유는 의도적으로 버린다.

## `NumberFromString`과 `FiniteFromString`

`Schema.NumberFromString`은 JavaScript의 숫자 강제 변환을 사용한다. 따라서 숫자로 해석할 수 없는 문자열도 `NaN`이라는 `number` 값으로 변환되어 decoding에 성공할 수 있다. `Infinity`와 `-Infinity`도 허용한다.

```text
"42"       → 42
"hello"    → NaN
""         → 0
"Infinity" → Infinity
```

`NaN`과 `Infinity`를 거부하려면 `Schema.FiniteFromString`을 사용한다.

또한 `JSON.stringify`는 `NaN`, `Infinity`, `-Infinity`를 JSON에 표현할 수 없어서 `null`로 직렬화한다. 따라서 출력의 `value: null`이 실제 decoding 값이 `null`이라는 뜻은 아닐 수 있다.

## `Effect.gen` 안의 `yield*`에는 무엇이 들어가는가

JavaScript 문법 자체의 `yield*`는 iterator를 구현한 값이라면 사용할 수 있다. 그러나 `Effect.gen`의 generator는 Effect runtime에 실행 명령을 넘기는 용도이므로, 여기서 `yield*` 하는 값은 `Effect<A, E, R>`여야 한다.

```text
JavaScript yield* → 일반 iterable에 순회 위임
Effect.gen yield* → Effect를 runtime에 넘기고 성공값 A를 돌려받음
```

`Schema.decodeUnknownEffect(schema)(input)`은 `Effect<Decoded, SchemaError, R>`를 반환하므로 `Effect.gen` 안에서 `yield*` 할 수 있다. 반면 `decodeUnknownResult`와 `decodeUnknownOption`의 결과는 Effect가 아니므로 `Effect.gen`에 그대로 넘기지 않는다.

## 업무 로직과 서비스 구현의 구분

업무 로직은 애플리케이션이 무엇을 해야 하는지를 표현한다. 예를 들어 이름을 받아 인사 문장을 얻거나, 주문 수량을 검증한 뒤 재고를 차감하는 처리 순서가 업무 로직이다.

서비스 구현은 그 작업을 실제로 어떻게 수행할지를 표현한다. 같은 메시지 전송 능력도 콘솔에 출력하거나, 외부 API를 호출하거나, 테스트용 배열에 저장하는 등 여러 구현을 가질 수 있다.

```text
업무 로직: 메시지를 전송해야 한다
서비스 계약: send(message) 기능이 필요하다
서비스 구현: 콘솔 / 외부 API / 테스트 메모리 중 어떻게 전송할지 결정한다
```

Effect의 Service는 업무 로직에 필요한 능력의 계약을 정의하고, Layer 또는 `provideService`는 그 계약을 만족하는 구현을 실행 경계에서 제공한다. 이 분리 덕분에 업무 로직을 바꾸지 않고 실제 구현과 테스트 구현을 교체할 수 있다.

## Effect의 세 번째 타입 `Requirements`가 해결하는 문제

일반 함수가 외부 모듈의 데이터베이스나 API client를 직접 가져오면 반환 타입만으로는 그 의존성을 알 수 없다. 의존성 제공을 빠뜨려도 컴파일 단계에서 확인하기 어렵고, 테스트에서 구현을 교체하기도 어려워진다.

`Effect<A, E, R>`의 `R`은 프로그램 실행에 필요한 서비스의 집합을 타입에 기록한다.

```text
Effect<Order, PaymentError, PaymentService | OrderRepository>
                            └─ 실행 전에 제공해야 하는 능력
```

프로그램을 합성하면 각 부분의 요구사항도 합쳐지고, 서비스를 제공하면 해당 요구사항이 제거된다. 모든 요구사항을 제공해 `R`이 `never`가 되면 외부에서 더 제공할 서비스가 없는 실행 가능한 프로그램이 된다.

## Layer memoization의 범위

Layer 값은 생성된 서비스 구현을 영구 보관하는 singleton이 아니라 서비스 구현을 만드는 실행 계획이다. Layer가 제공된 최종 Effect를 실행할 때 구현을 만들고, 한 번의 Layer 구성 및 실행 범위 안에서는 같은 구현을 재사용한다.

```text
첫 번째 runSync
→ Layer 준비 → Counter 생성 → 1, 2 → 종료

두 번째 runSync
→ Layer 다시 준비 → Counter 생성 → 1, 2 → 종료
```

따라서 같은 runnable을 다시 실행해도 이전 실행의 mutable 상태가 이어지지 않는다. memoization은 전역 캐시가 아니라 현재 Layer 구성 범위 안에서 중복 생성을 피하는 기능이다.

## 프로그램을 값으로 구성한다는 의미

Effect에서는 작업을 정의하는 시점에 바로 실행하지 않고, 나중에 실행할 작업을 나타내는 `Effect` 값을 만든다.

```ts
const program = Effect.sync(() => {
  console.log("Hello");
});
```

이때 `console.log`는 실행되지 않는다. `program`은 “실행되면 Hello를 출력한다”는 계획을 표현한다. 이 값은 일반 값처럼 변수에 저장하고, 함수에 전달하고, `map`, `flatMap`, `provide` 등의 연산으로 새로운 프로그램으로 합성할 수 있다.

```text
Effect.succeed(10)
→ 10으로 성공하는 실행 계획

Effect.map(program, n => n * 2)
→ 기존 계획의 성공값을 변환하는 새로운 실행 계획
```

합성 과정에서도 작업은 실행되지 않는다. `runSync`나 `runPromise` 같은 runner에 최종 Effect를 전달하면 runtime이 계획을 해석하면서 실제 작업을 수행한다.

```text
Effect 생성·합성
→ 프로그램을 값으로 구성
→ runner에 전달
→ runtime이 해석하고 실행
→ 성공값 또는 실패 원인 반환
```

일반 함수도 호출 전까지 실행되지 않는 값이라는 점에서 비슷하다. Effect는 지연 실행에 성공 타입 `A`, 예상 오류 `E`, 필요한 서비스 `R`과 취소·자원 관리·동시성 같은 실행 규칙을 더한 프로그램 표현이다.

## `acquireUseRelease`와 `try/finally`

`Effect.acquireUseRelease`는 자원을 위한 Effect식 `try/finally`로 이해할 수 있다.

```text
acquire → try에 들어가기 전 자원 획득
use     → try 본문
release → finally
```

`acquire`가 성공한 뒤에는 `use`가 성공하거나 실패하거나 Fiber interruption으로 중단되어도 `release`가 실행된다. 반대로 `acquire` 자체가 실패하면 정리할 자원이 만들어지지 않았으므로 `release`는 실행되지 않는다.

일반적인 `finally`와 달리 release도 Effect이므로 비동기 작업과 서비스 의존성을 가질 수 있다. 또한 release는 `Exit`을 전달받아 use 단계가 성공, 실패, 중단 중 어떤 결과로 끝났는지 확인할 수 있고, 기본적으로 획득과 해제 작업은 interruption으로부터 보호된다.

```text
acquire 성공
→ use 실행
→ use의 종료 결과를 Exit으로 전달
→ release 실행
→ 전체 프로그램 종료
```
