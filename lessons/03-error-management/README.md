# 03. 오류 관리

예상 가능한 실패를 타입으로 표현하고, 필요한 오류만 선택적으로 복구합니다.

## 학습 목표

- 성공 채널과 오류 채널을 각각 변환할 수 있다.
- 문자열 대신 구분 가능한 도메인 오류를 정의할 수 있다.
- 여러 오류가 합성될 때 오류 타입이 어떻게 누적되는지 설명할 수 있다.
- 예상된 오류와 defect를 구분할 수 있다.

## 학습 내역

| 순서 | 파일 | 내용 | 상태 |
| --- | --- | --- | --- |
| 1 | `01-tagged-error.ts` | `_tag`와 정보를 가진 도메인 오류 정의 | 완료 |
| 2 | `02-error-union.ts` | Effect 합성으로 만들어지는 오류 유니온 | 완료 |
| 3 | `03-catch.ts` | 오류 채널 전체를 복구 | 완료 |
| 4 | `04-catch-tag.ts` | `_tag`를 기준으로 필요한 오류만 복구 | 진행 중 |
| 5 | `05-map-error.ts` | 오류 값을 다른 오류 타입으로 변환 | 예정 |
| 6 | `06-fallback.ts` | 실패했을 때 대체 성공 값 사용 | 예정 |
| 7 | `07-defect-and-cause.ts` | 예상된 오류, defect, `Cause`의 차이 | 예정 |
| 8 | `08-retry-and-timeout.ts` | 재시도와 제한 시간 정책 적용 | 예정 |

## 핵심 구분

Effect의 실패에는 성격이 다른 두 종류가 있습니다.

- 예상된 오류: 잘못된 입력이나 조회 실패처럼 프로그램이 처리 방법을 결정할 수 있는 실패
- defect: 버그나 깨진 불변식처럼 정상적인 업무 흐름으로 다루지 않는 실패

예상된 오류는 `Effect<Success, Error, Requirements>`의 `Error` 자리에 나타납니다.

## 01. Tagged Error

`Data.TaggedError`를 사용하면 오류의 종류를 나타내는 `_tag`와 오류에 필요한 데이터를 하나의 타입으로 정의할 수 있습니다.

```text
InvalidQuantity
├─ _tag: "InvalidQuantity"
└─ quantity: number
```

`Effect.fail`에 tagged error 인스턴스를 전달하면 문자열이 아니라 구체적인 오류 타입이 오류 채널에 나타납니다.

```ts
Effect<number, InvalidQuantity, never>
```

조건문의 성공 분기와 실패 분기가 Effect 유니온으로 추론되더라도, 함수 반환 타입을 명시해 하나의 프로그램 인터페이스로 표현할 수 있습니다.

## 02. 오류 유니온

오류 타입이 서로 다른 Effect를 합성하면 최종 프로그램의 오류 채널에는 가능한 오류들이 유니온으로 누적됩니다.

```ts
Effect<number, InvalidQuantity | InsufficientStock, never>
```

오류 유니온은 모든 오류가 한 번에 발생한다는 뜻이 아니라, 실행 경로에 따라 그중 하나로 실패할 수 있다는 뜻입니다. 앞 단계가 실패하면 뒤 단계는 실행되지 않지만, 실행 전 프로그램의 타입에는 두 실패 가능성이 모두 남습니다.

## 03. `Effect.catch`

`Effect.catch`는 오류 채널의 모든 예상된 오류를 받아 새로운 Effect로 복구합니다. 복구 Effect가 실패하지 않으면 기존 오류 타입은 처리되어 최종 오류 채널에서 사라집니다.

```text
Effect<number, InvalidQuantity, never>
→ InvalidQuantity를 기본 수량 1로 복구
→ Effect<number, never, never>
```

`catch`는 `Effect.fail`로 표현된 typed error를 처리하며 defect까지 자동으로 복구하지는 않습니다.

## 완료 조건

- [ ] 오류 타입만 보고 발생 가능한 실패를 파악할 수 있다.
- [ ] `_tag`를 이용해 오류를 구분할 수 있다.
- [ ] 모든 오류를 복구하는 것과 특정 오류만 복구하는 것의 차이를 설명할 수 있다.
- [ ] 예상된 오류와 defect를 구분할 수 있다.

## 참고

- [Two Types of Errors](https://effect.website/docs/v4/error-management/two-error-types)
- [Expected Errors](https://effect.website/docs/v4/error-management/expected-errors)
