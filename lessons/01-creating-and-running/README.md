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

### `Effect.fail`과 오류 채널

`Effect.fail`은 예상된 실패를 Effect의 오류 채널에 기록합니다.

```ts
Effect.Effect<never, string, never>
//            성공값 오류    의존성
```

이 Effect는 성공 값을 만들 수 없으므로 성공 타입이 `never`이고, 문자열 오류로 실패할 수 있습니다.

`Effect.runSyncExit`은 실패를 예외로 던지지 않고 `Exit` 값으로 반환합니다. 실행 결과의 `_tag`는 `"Failure"`이며, 실패 정보는 `Cause`에 보관됩니다.

### `Effect.try`와 JavaScript 예외

`Effect.try`는 실행 중 예외를 던질 수 있는 동기 함수를 감쌉니다. 함수가 값을 반환하면 성공 채널로 전달하고, `throw`가 발생하면 예외를 잡아 Effect의 오류 채널로 변환합니다.

```text
JSON.parse 실행
├─ 값 반환 → 성공 채널
└─ throw    → UnknownError → 오류 채널
```

`Effect.sync`와의 선택 기준은 예상된 실패 여부입니다.

- 예외를 던지지 않는다고 가정하는 동기 작업: `Effect.sync`
- 예외 가능성을 예상된 오류로 모델링할 동기 작업: `Effect.try`

`Effect.try`에 전달한 함수에서 계산 결과를 반환해야 그 값이 Effect의 성공 타입이 됩니다. 현재 실습의 `JSON.parse` 반환 타입은 `any`이며, 외부 데이터의 안전한 타입 검증은 Schema 단계에서 다룹니다.

`Effect.runSyncExit`의 반환값에는 `exit`이라는 이름을 사용했습니다. `Exit`은 성공 값 자체가 아니라 Effect 실행이 성공 또는 실패 중 어떤 상태로 끝났는지를 나타냅니다.

```text
Exit
├─ Success → value
└─ Failure → cause
```

### `Effect.promise`와 비동기 실행

`Effect.promise`는 실패하지 않는다고 약속한 비동기 작업을 Effect로 만듭니다. Promise를 만드는 함수는 Effect 생성 시점이 아니라 runtime이 프로그램을 실행할 때 호출됩니다.

```text
program 생성 완료
Promise 생성
{ result: '비동기 완료' }
```

작성한 `program`의 타입은 `Effect.Effect<string, never, never>`입니다.

- Promise가 resolve하면 `string`이 성공 채널로 전달됩니다.
- 오류 타입 `never`는 이 Promise가 reject하지 않는다는 계약을 나타냅니다.
- `Effect.promise`에 전달한 Promise가 계약과 달리 reject하면 typed error가 아니라 defect가 됩니다.

비동기 경계가 포함된 프로그램은 `runSync`가 아니라 `Effect.runPromise`로 실행하고 `await`으로 성공 값을 기다립니다. reject 가능성을 예상된 오류로 모델링하는 방법은 `Effect.tryPromise`에서 다룹니다.

### `Effect.tryPromise`와 Promise rejection

`Effect.tryPromise`는 reject할 수 있는 Promise를 Effect로 감싸고, rejection을 예상된 실패로 다룹니다.

```text
Promise 실행
├─ resolve → 성공 채널
└─ reject  → UnknownError → 오류 채널
```

이번 실습에서 추론된 타입은 `Effect.Effect<string, UnknownError, never>`입니다.

- `string`: Promise가 resolve할 때 얻는 성공 값
- `UnknownError`: Promise가 reject할 때 사용하는 기본 오류 타입
- `never`: 실행에 필요한 외부 서비스가 없음

`UnknownError`는 `reject(Error(...))`를 보고 추론한 타입이 아닙니다. JavaScript의 `Promise<T>`는 resolve 값의 타입만 표현하고 rejection 값의 타입은 표현하지 않기 때문에, `Effect.tryPromise`가 기본 오류 타입으로 제공합니다. 오류 타입을 직접 정하려면 `try`와 `catch`를 받는 형태를 사용해 rejection 값을 도메인 오류로 변환할 수 있습니다.

`Effect.runPromiseExit`은 비동기 실행이 끝날 때까지 기다린 뒤 `Exit`을 반환합니다. 따라서 실패도 프로그램 밖으로 던져지지 않고 `_tag: "Failure"`와 `cause`를 통해 값으로 확인할 수 있습니다.

### Effect 생성 함수 비교

`07-constructors.ts`에서 지금까지 사용한 생성 함수들을 한곳에 모아 성공 타입, 오류 타입, 실행 시점을 비교했습니다.

| 생성 함수           | 나타내는 작업                        | 성공 타입         | 기본 오류 타입   | 콜백 실행 시점  |
| ------------------- | ------------------------------------ | ----------------- | ---------------- | --------------- |
| `Effect.succeed`    | 이미 준비된 성공 값                  | 전달한 값의 타입  | `never`          | 콜백 없음       |
| `Effect.fail`       | 이미 준비된 예상된 실패              | `never`           | 전달한 오류 타입 | 콜백 없음       |
| `Effect.sync`       | 실패하지 않는다고 가정한 동기 작업   | 반환값 타입       | `never`          | Effect 실행 시점 |
| `Effect.try`        | 예외가 발생할 수 있는 동기 작업      | 반환값 타입       | `UnknownError`   | Effect 실행 시점 |
| `Effect.promise`    | 실패하지 않는다고 가정한 비동기 작업 | Promise 성공 타입 | `never`          | Effect 실행 시점 |
| `Effect.tryPromise` | reject할 수 있는 비동기 작업          | Promise 성공 타입 | `UnknownError`   | Effect 실행 시점 |

`new Promise<string>(...)`의 `string`은 resolve 값, 즉 Effect의 성공 타입을 지정합니다. reject에 전달한 값의 타입은 `Promise<T>`에 포함되지 않으므로 `Effect.tryPromise`의 기본 오류 타입은 `UnknownError`입니다.

## 핵심 정리

> Effect 값은 실행 결과가 아니라, runtime이 나중에 실행할 프로그램에 대한 설명이다.

## 학습 내역

| 상태      | 파일                 | 학습 내용                                                                   |
| --------- | -------------------- | --------------------------------------------------------------------------- |
| 완료      | `01-succeed.ts`      | `Effect.succeed`로 성공하는 Effect를 만들고 `Effect.runPromise`로 실행한다. |
| 완료      | `02-sync.ts`         | `Effect.sync`로 동기 부수 효과의 실행을 runtime까지 지연한다.               |
| 완료      | `03-fail.ts`         | `Effect.fail`로 예상된 실패를 오류 채널에 표현한다.                         |
| 완료      | `04-try.ts`          | `Effect.try`로 예외가 발생할 수 있는 동기 작업을 안전하게 감싼다.           |
| 완료      | `05-promise.ts`      | `Effect.promise`로 실패하지 않는 비동기 작업을 표현한다.                    |
| 완료      | `06-try-promise.ts`  | `Effect.tryPromise`로 Promise rejection을 `UnknownError`로 변환한다.        |
| 완료      | `07-constructors.ts` | 생성 함수별 실행 시점과 성공 값, 오류 타입의 차이를 비교한다.               |
