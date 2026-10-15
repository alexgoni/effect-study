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
