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
new ContImpl(self, mapCont, f)
```

- `self`: 먼저 실행할 원본 Effect
- `mapCont`: 원본 Effect가 성공한 뒤 실행할 내부 continuation
- `f`: 사용자가 `map`에 전달한 변환 함수

`ContImpl`은 `self`와 `f`를 내부에 저장한다. runtime은 `self`를 먼저 실행하고, 성공 값을 얻으면 저장해 둔 `mapCont`를 호출한다.

`mapCont`의 실제 구현은 성공 값 `value`를 전달받아 `payload`에 저장된 `f`를 호출한다.

```ts
const mapCont = function(this: { readonly payload: any }, value: any, fiber: FiberImpl) {
  const f = this.payload
  return fiber.succeedWith(continuationMarksStack ? f(value) : internalCall(() => f(value)))
}
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
