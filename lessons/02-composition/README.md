# 02. Effect 합성

작은 Effect를 연결해 하나의 프로그램을 만드는 방법을 학습합니다.

1단계에서는 Effect를 만들고 실행했습니다. 이번 단계에서는 Effect 안의 값을 중간에 꺼내거나 실행하지 않고, 다음 계산으로 전달하는 방법을 익힙니다.

## 학습 목표

- `map`과 `flatMap`의 차이를 설명할 수 있다.
- 앞 단계의 성공 값을 다음 Effect에 전달할 수 있다.
- 여러 Effect의 오류 타입이 합성되는 과정을 확인할 수 있다.
- `pipe`로 데이터의 흐름을 위에서 아래로 표현할 수 있다.
- `Effect.gen`과 `yield*`로 순차적인 프로그램을 작성할 수 있다.
- 합성 중간에는 Effect를 실행하지 않고, 완성된 프로그램을 경계에서 한 번만 실행한다.

## 합성의 기본 모양

`map`은 성공 값을 일반 값으로 변환합니다.

```text
Effect<A, E, R>
    + (A → B)
    ↓
Effect<B, E, R>
```

`flatMap`은 성공 값을 이용해 다음 Effect를 선택하고, 중첩된 Effect를 하나로 합칩니다.

```text
Effect<A, E1, R1>
    + (A → Effect<B, E2, R2>)
    ↓
Effect<B, E1 | E2, R1 | R2>
```

판단 기준은 변환 함수의 반환값입니다.

- 일반 값을 반환한다: `Effect.map`
- 새로운 Effect를 반환한다: `Effect.flatMap`

### `Effect.map`으로 성공 값 변환하기

`Effect.map`은 원본 Effect의 성공 값을 받아 일반 값으로 변환하고, 그 결과를 성공 값으로 갖는 새로운 Effect를 만듭니다.

```text
Effect<number, never, never>
    ↓ number → string
Effect<string, never, never>
```

원본 Effect는 변경되지 않으며 오류 타입과 의존성 타입도 그대로 유지됩니다. 변환 함수는 `map`을 호출할 때 바로 실행되는 것이 아니라, 합성된 Effect를 runtime에 전달했을 때 실행됩니다.

### `Effect.flatMap`으로 다음 Effect 연결하기

콜백이 일반 값이 아니라 Effect를 반환하면 `map`은 반환된 Effect를 성공 값으로 취급하므로 Effect가 중첩됩니다.

```text
map
Effect<number, never, never>
    + (number → Effect<number, string, never>)
    ↓
Effect<Effect<number, string, never>, never, never>
```

`flatMap`은 앞 Effect의 성공 값을 콜백에 전달하고, 콜백이 반환한 Effect를 다음 실행 단계로 연결해 하나의 Effect로 평탄화합니다.

```text
flatMap
Effect<number, never, never>
    + (number → Effect<number, string, never>)
    ↓
Effect<number, string, never>
```

Effect를 반환하는 함수는 모든 분기에서 Effect를 반환해야 합니다. 실패 분기에서 `Effect.fail`을 반환했다면 성공 분기의 일반 값도 `Effect.succeed`로 감싸 같은 반환 문맥을 유지합니다.

### `pipe`와 data-last 합성

`pipe`는 첫 번째 값을 다음 함수에 전달하고, 각 함수의 반환값을 그다음 함수에 차례로 전달합니다. Effect 내부의 성공 값을 직접 꺼내거나 Effect를 실행하지는 않습니다.

```text
source Effect
    ↓ Effect.map(number → number)
새로운 Effect
    ↓ Effect.map(number → number)
새로운 Effect
    ↓ Effect.map(number → string)
program Effect
```

`Effect.map(source, f)`는 source를 직접 받는 data-first 형태이고, `Effect.map(f)`는 source를 기다리는 data-last 함수입니다. `pipe(source, Effect.map(f))`는 data-last 함수에 source를 전달합니다.

```text
Effect.map(source, f)
= Effect.map(f)(source)
= pipe(source, Effect.map(f))
```

`pipe`로 Effect를 합성하는 시점에는 실행 계획만 연결됩니다. 연결된 `map` 콜백은 완성된 `program`을 runtime에 전달할 때 실행됩니다.

### `Effect.andThen`으로 순서 연결하기

두 번째 작업이 첫 번째 성공 값에 의존하지 않는다면 `Effect.andThen`에 다음 Effect 자체를 전달해 실행 순서만 연결할 수 있습니다.

```text
첫 번째 Effect<number, E1, R1>
    ↓ 성공 값 number는 버림
두 번째 Effect<string, E2, R2>
    ↓
전체 Effect<string, E1 | E2, R1 | R2>
```

첫 번째 Effect가 성공해야 두 번째 Effect가 실행됩니다. 전체 프로그램의 성공 값은 두 번째 Effect의 성공 값입니다. 첫 번째 Effect가 실패하면 두 번째 Effect는 실행되지 않습니다.

### `Effect.gen`과 `yield*`로 순차 합성하기

`Effect.gen`은 `map`과 `flatMap`으로 표현할 수 있는 합성을 generator 문법으로 작성하게 합니다. Effect 하나의 성공 값을 일반 값으로 변환하는 경우는 `map`과 동등하고, 여러 `yield*`로 다음 Effect를 이어가는 순차 합성은 `flatMap`과 동등합니다. `yield*`는 Effect를 runtime에 넘기고, 성공하면 성공 값을 지역 변수에 바인딩합니다.

```text
yield* Effect<A, E, R>
        ↓ 성공
지역 변수: A
```

여러 Effect를 `yield*`하면 앞 단계가 성공한 뒤 다음 단계로 진행합니다. 어느 단계든 실패하면 generator의 나머지 코드는 실행되지 않고, 해당 오류가 전체 Effect로 전달됩니다.

generator의 마지막 `return` 값은 `Effect.gen`이 만든 Effect의 최종 성공 값입니다. 일반 값을 반환하며 `Effect.succeed`로 다시 감싸지 않습니다.

```text
Effect.gen 내부 return B
→ Effect<B, 합쳐진 오류, 합쳐진 의존성>
```

generator 코드는 순차적으로 보이지만 `Effect.gen`을 호출할 때 작업이 실행되는 것은 아닙니다. 완성된 Effect를 runtime에 전달할 때 generator와 각 Effect가 실행됩니다.

### 실패 시 short-circuit

`Effect.gen`에서 `yield*`한 Effect가 실패하면 generator는 성공 값으로 재개되지 않으며 이후 코드는 실행되지 않습니다. 실패 이후에 선언된 Effect 값이 이미 존재해도 runtime이 해당 실행 단계까지 도달하지 않으므로 내부 callback은 실행되지 않습니다.

```text
첫 단계 성공
→ 중간 단계 실패
→ 이후 단계 건너뜀
→ 전체 프로그램 실패
```

## 실행 원칙

합성 과정에서는 `runSync`나 `runPromise`를 호출하지 않습니다. 각 단계는 새로운 Effect 값을 만들 뿐이며, 완성된 `program`만 애플리케이션 경계에서 실행합니다.

```text
작은 Effect
    ↓ 합성
더 큰 Effect
    ↓ 합성
완성된 program
    ↓ 한 번 실행
결과
```

앞 단계가 실패하면 뒤에 연결된 단계는 실행되지 않습니다. 실패는 예외로 흐름을 벗어나는 대신 합성된 Effect의 오류 채널을 통해 전달됩니다.

## 학습 내역

| 상태      | 파일                       | 학습 내용                                                     |
| --------- | -------------------------- | ------------------------------------------------------------- |
| 완료      | `01-map.ts`                | `map`으로 성공 값을 일반 값으로 변환한다.                     |
| 완료      | `02-flat-map.ts`           | `flatMap`으로 성공 값에 의존하는 다음 Effect를 연결한다.      |
| 완료      | `03-pipe.ts`               | `pipe`와 data-last 형태로 합성 과정을 위에서 아래로 표현한다. |
| 완료      | `04-and-then.ts`           | 앞 Effect 다음에 다른 Effect를 실행하고 결과를 이어받는다.    |
| 완료      | `05-gen.ts`                | `Effect.gen`과 `yield*`로 여러 Effect를 순차적으로 합성한다.  |
| 완료      | `06-short-circuit.ts`      | 앞 단계가 실패하면 뒤 단계가 실행되지 않는 것을 확인한다.     |
| 진행 예정 | `07-composition-styles.ts` | 같은 프로그램을 `flatMap`과 `gen`으로 작성해 구조를 비교한다. |

## 단계 완료 조건

- `map`에 Effect를 반환했을 때 왜 중첩이 생기는지 설명할 수 있다.
- `flatMap`으로 연결된 두 Effect의 오류 타입이 합쳐지는 것을 확인한다.
- `pipe`가 Effect를 실행하는 함수가 아니라 합성 표현 방식임을 설명할 수 있다.
- `yield*` 뒤에는 Effect의 성공 값이 들어온다는 것을 이해한다.
- 어느 합성 방식을 사용해도 실행은 마지막 경계에서 한 번만 한다.

## 핵심 질문

각 실습에서 다음 세 가지를 확인합니다.

1. 현재 함수가 받는 값은 Effect인가, Effect의 성공 값인가?
2. 콜백이 반환하는 것은 일반 값인가, 새로운 Effect인가?
3. 합성된 `Effect<Success, Error, Requirements>`의 세 타입은 어떻게 변했는가?

## 참고

- [Using Generators](https://effect.website/docs/v4/getting-started/using-generators)
- [Building Pipelines](https://effect.website/docs/v4/getting-started/building-pipelines)
