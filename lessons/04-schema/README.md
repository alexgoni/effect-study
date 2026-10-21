# 04. Schema

외부 데이터를 파싱하고 검증해 도메인 타입으로 변환합니다.

## 학습 목표

- `unknown` 값을 검증하기 전에는 신뢰하지 않는다.
- Schema 하나에서 런타임 검증과 TypeScript 타입을 함께 얻는다.
- 외부 데이터의 형태와 애플리케이션 내부의 도메인 타입을 분리한다.
- 검증 실패를 Effect의 typed error로 합성한다.

## 학습 내역

| 순서 | 파일 | 내용 | 상태 |
| --- | --- | --- | --- |
| 1 | `01-primitive-schema.ts` | primitive Schema로 `unknown` 검증 | 완료 |
| 2 | `02-struct-schema.ts` | 객체 필드 구조 검증 | 완료 |
| 3 | `03-decoding-results.ts` | Effect, Result, Option 디코더 비교 | 완료 |
| 4 | `04-refinement.ts` | 값에 추가 조건 적용 | 진행 중 |
| 5 | `05-transformation.ts` | 외부 표현을 내부 타입으로 변환 | 예정 |
| 6 | `06-branded-type.ts` | 검증된 값을 도메인 타입으로 구분 | 예정 |
| 7 | `07-external-to-domain.ts` | 외부 데이터 검증과 도메인 로직 합성 | 예정 |

## 핵심 구분

TypeScript 타입은 컴파일할 때만 존재하므로 네트워크 응답, JSON, 환경 변수 같은 런타임 값이 실제로 그 타입인지 보장하지 않습니다. Schema는 런타임에 값을 검사하고, 성공한 값에 대응하는 TypeScript 타입을 제공합니다.

```text
unknown 외부 값
→ Schema로 검증
├─ 성공: 신뢰 가능한 타입의 값
└─ 실패: SchemaError
```

## 01. Primitive Schema

`Schema.decodeUnknownEffect`는 `unknown` 입력을 Schema로 검사하고, 성공하면 Schema의 타입으로 좁혀진 값을 반환하며 실패하면 오류 채널에 `SchemaError`를 반환합니다.

```text
Schema.String + unknown
→ Effect<string, SchemaError, never>
```

타입 단언은 런타임 값을 검사하지 않지만 Schema decoding은 실제 값이 규칙을 만족하는지 실행 시점에 검사합니다.

## 02. `Schema.Struct`

`Schema.Struct`는 객체의 각 필드에 Schema를 지정해 런타임 구조를 검증합니다. 같은 Schema의 `Type`으로 검증을 통과한 값의 TypeScript 타입도 얻을 수 있습니다.

```text
input: unknown
→ UserSchema로 검증
→ { readonly id: number; readonly name: string }
```

검증 전 입력을 `unknown`으로 유지하면 외부 데이터의 필드에 미리 접근할 수 없고, decoding 성공 이후에만 신뢰 가능한 타입으로 사용할 수 있습니다.

## 03. 디코딩 결과 선택

같은 Schema 검증도 사용 목적에 따라 서로 다른 자료형으로 받을 수 있습니다.

```text
decodeUnknownEffect → Effect<A, SchemaError, R>
decodeUnknownResult → Result<A, SchemaError>
decodeUnknownOption → Option<A>
```

Effect는 다른 Effect 작업과 합성할 때, Result는 성공 또는 자세한 실패를 즉시 값으로 다룰 때, Option은 실패 이유 없이 성공 여부만 필요할 때 사용합니다. Result와 Option은 이미 계산된 값이므로 Effect runner로 실행하지 않습니다.

## 완료 조건

- [ ] 타입 선언과 런타임 검증의 차이를 설명할 수 있다.
- [ ] 객체 Schema에서 타입을 추론할 수 있다.
- [ ] 검증, 정제, 변환의 차이를 설명할 수 있다.
- [ ] 외부 표현을 검증된 도메인 값으로 변환할 수 있다.

## 참고

- [Schema Introduction](https://effect.website/docs/v4/schema/introduction)
- [Basic Usage](https://effect.website/docs/v4/schema/basic-usage)
