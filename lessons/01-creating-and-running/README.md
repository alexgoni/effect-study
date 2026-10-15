# 01. Effect 생성과 실행

Effect 값을 생성하고 애플리케이션 경계에서 실행하는 방법을 학습합니다.

## 학습한 내용

### Effect 타입

작성한 `program`에는 다음 타입이 추론됩니다.

```ts
Effect.Effect<string, never, never>;
//            성공값  오류   의존성
```

- `string`: 실행하면 문자열로 성공한다.
- 첫 번째 `never`: 예상된 실패가 없다.
- 두 번째 `never`: 필요한 외부 서비스가 없다.

### Effect와 program

`Effect`는 실행 결과가 아니라 실행할 계산을 설명하는 값입니다. `program`은 특별한 키워드가 아니며, 실행할 전체 프로그램을 담는 변수에 관례적으로 사용하는 이름입니다.

```text
Effect.succeed(...)
        ↓
실행할 계산을 설명하는 Effect 값
        ↓
program 변수에 저장
        ↓
Effect.runPromise(program)으로 실행
```

`program`과 `result`의 차이는 다음과 같습니다.

- `program`: 아직 실행되지 않은 계산의 설명
- `result`: Effect를 실행한 뒤 얻은 실제 성공 값

### 함수형 프로그래밍과의 연결

함수형 프로그래밍에서는 실행할 작업도 하나의 값으로 다룹니다. 작업을 바로 실행하지 않고 값으로 만든 뒤 조합 가능한 상태로 유지하고, 애플리케이션의 경계에서 실행합니다.

`console.log` 역시 부수 효과입니다. 이번 실습에서는 Effect 실행 결과를 관찰하기 위해 이 부수 효과를 프로그램의 바깥 경계에 두었습니다.

```text
Functional Core       Imperative Shell
Effect 프로그램   →   실행하고 결과 출력
```

부수 효과를 없애는 것이 아니라, 발생하는 위치를 명확하게 통제하는 것이 핵심입니다.

### `Effect.sync`와 실행 지연

`Effect.sync`에 전달한 함수는 Effect 값을 만드는 시점에는 **실행**되지 않습니다. `Effect.runPromise`로 runtime에 전달한 뒤에 실행됩니다.

```text
program 생성 완료
Effect 내부 실행
{ result: '완료' }
```

작성한 `program`의 타입은 `Effect.Effect<string, never, never>`입니다. 실행하면 문자열로 성공하며, 예상된 오류와 필요한 의존성이 없다는 뜻입니다.

`Effect.sync`에 전달하는 함수는 예외를 던지지 않는 작업이어야 합니다. 여기서 예외가 발생하면 타입이 지정된 오류가 아니라 defect로 취급됩니다. 예외 가능성이 있는 동기 작업은 이후 `Effect.try`에서 다룹니다.

## 핵심 정리

> Effect 값은 실행 결과가 아니라, runtime이 나중에 실행할 프로그램에 대한 설명이다.

## 학습 내역

| 상태      | 파일                 | 학습 내용                                                                   |
| --------- | -------------------- | --------------------------------------------------------------------------- |
| 완료      | `01-succeed.ts`      | `Effect.succeed`로 성공하는 Effect를 만들고 `Effect.runPromise`로 실행한다. |
| 완료      | `02-sync.ts`         | `Effect.sync`로 동기 부수 효과의 실행을 runtime까지 지연한다.               |
| 진행 예정 | `03-fail.ts`         | `Effect.fail`로 예상된 실패를 오류 채널에 표현한다.                         |
| 진행 예정 | `04-try.ts`          | `Effect.try`로 예외가 발생할 수 있는 동기 작업을 안전하게 감싼다.           |
| 진행 예정 | `05-promise.ts`      | `Effect.promise`로 실패하지 않는 비동기 작업을 표현한다.                    |
| 진행 예정 | `06-try-promise.ts`  | `Effect.tryPromise`로 Promise의 실패를 타입이 지정된 오류로 변환한다.       |
| 진행 예정 | `07-constructors.ts` | 생성 함수별 실행 시점과 성공 값, 오류 타입의 차이를 비교한다.               |
