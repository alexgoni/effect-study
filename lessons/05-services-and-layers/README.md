# 05. Service와 Layer

프로그램의 의존성을 타입으로 표현하고 구현을 조립합니다.

## 학습 목표

- 프로그램이 필요로 하는 능력을 `Effect`의 `Requirements` 타입에 표현한다.
- 업무 로직과 서비스 구현을 분리한다.
- 같은 프로그램에 실제 구현과 테스트 구현을 교체해 제공한다.
- 여러 서비스 구현을 `Layer`로 조립한다.
- Layer가 구현 생성과 생명주기를 관리하는 방식을 이해한다.

## 학습 내역

| 순서 | 파일                        | 내용                                         | 상태    |
| ---- | --------------------------- | -------------------------------------------- | ------- |
| 1    | `01-service-requirement.ts` | 필요한 서비스를 `Requirements` 타입에 남기기 | 완료    |
| 2    | `02-provide-service.ts`     | 서비스 구현을 직접 제공하기                  | 완료    |
| 3    | `03-swap-implementation.ts` | 실제 구현과 테스트 구현 교체하기             | 완료    |
| 4    | `04-layer-succeed.ts`       | 이미 만들어진 구현을 Layer로 제공하기        | 완료    |
| 5    | `05-effectful-layer.ts`     | Effect로 서비스 구현을 생성하는 Layer 만들기 | 완료    |
| 6    | `06-layer-composition.ts`   | 여러 Layer의 의존성 조립하기                 | 진행 중 |
| 7    | `07-layer-memoization.ts`   | Layer의 생명주기와 memoization 이해하기      | 예정    |

## 01. 서비스 요구사항

`Context.Service`는 프로그램이 필요로 하는 능력의 이름과 계약을 정의합니다. 서비스 구현을 아직 제공하지 않아도 `Effect.service`로 그 능력을 사용하는 프로그램을 작성할 수 있습니다.

```text
Effect<string, never, Greeter>
                      └─ 실행에 Greeter 서비스가 필요함
```

서비스에서 호출한 함수가 `Effect`를 반환하면 그 값을 그냥 버리지 않고 `yield*`로 현재 프로그램에 합성해야 합니다. 그래야 서비스 작업의 성공값, 오류, 추가 요구사항이 바깥 프로그램의 타입과 실행 흐름에 반영됩니다.

## 02. 서비스 구현 직접 제공하기

`Effect.provideService`는 프로그램의 서비스 요구사항을 계약에 맞는 구현으로 채웁니다. 서비스를 제공하면 해당 서비스가 `Requirements`에서 제거됩니다.

```text
Effect<string, never, Greeter>
→ Greeter 구현 제공
→ Effect<string, never, never>
```

두 번째 인자에는 서비스 이름 문자열이 아니라 `Context.Service`로 정의한 서비스 키를 전달합니다. 세 번째 인자인 구현 객체는 서비스 계약과 같은 프로퍼티와 함수 타입을 가져야 합니다.

## 03. 서비스 구현 교체하기

서비스를 사용하는 프로그램은 필요한 능력의 계약에만 의존합니다. 따라서 업무 프로그램을 한 번만 정의하고, 실행 경계에서 실제 구현과 테스트 구현을 각각 제공할 수 있습니다.

```text
같은 Effect program
├─ live 구현 제공 → liveProgram
└─ test 구현 제공 → testProgram
```

`Effect.provideService`의 반환값은 서비스 구현체가 아니라 구현이 제공된 새로운 Effect입니다. 변수 이름도 `liveProgram`, `testProgram`처럼 값의 실제 역할을 나타내면 구현 객체와 실행 프로그램을 구분하기 쉽습니다.

## 04. `Layer.succeed`

`Layer.succeed`는 이미 만들어진 서비스 구현 객체를 실패 없이 제공하는 Layer를 만듭니다. `Effect.provide`로 Layer를 프로그램에 연결하면 Layer가 제공하는 서비스가 프로그램의 `Requirements`에서 제거됩니다.

```text
구현 객체
→ Layer.succeed로 Greeter Layer 생성
→ Effect.provide로 program에 연결
→ Effect<string, never, never>
```

`Layer.succeed`의 `succeed`는 서비스 메서드가 항상 성공한다는 뜻이 아니라 구현 객체를 Layer로 준비하는 과정 자체의 오류 타입이 `never`라는 뜻입니다. 구현 객체는 `greeterImplementation`처럼 서비스 구현임을 나타내는 이름으로 함수나 실행 프로그램과 구분할 수 있습니다.

## 05. `Layer.effect`

`Layer.effect`는 Effect를 실행해 서비스 구현을 생성합니다. 설정 검증이나 외부 시스템 연결처럼 구현 준비 과정이 실패할 수 있으면 그 오류가 Layer의 오류 타입에 나타납니다.

```text
Effect<Greeter 구현, GreeterSetupError, never>
→ Layer.effect
→ Layer<Greeter, GreeterSetupError, never>
```

Layer를 프로그램에 제공하면 구현 준비 오류가 최종 프로그램의 오류 채널에 합쳐집니다. 실행할 때는 Layer를 먼저 준비하므로 Layer 생성이 실패하면 서비스가 필요한 프로그램 본문은 실행되지 않습니다.

## 완료 조건

- [ ] 업무 로직이 구체적인 구현체를 직접 가져오지 않는다.
- [ ] 프로그램에 필요한 서비스가 `Requirements` 타입에 나타난다.
- [ ] 같은 프로그램에 서로 다른 구현을 제공할 수 있다.
- [ ] 여러 Layer를 조합해 실행 가능한 프로그램을 만들 수 있다.
- [ ] Layer가 같은 서비스 구현을 공유하는 조건을 설명할 수 있다.

## 참고

- [Managing Services](https://effect.website/docs/v4/requirements-management/services)
- [Managing Layers](https://effect.website/docs/v4/requirements-management/layers)
