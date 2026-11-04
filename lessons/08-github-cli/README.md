# 08. GitHub 저장소 정보 조회 CLI

지금까지 학습한 Effect의 생성, 합성, 오류, Schema, Service, Layer, 동시성, 테스트와 운영 기능을 하나의 프로그램에 적용합니다.

## 프로젝트 목표

- 외부에서 받은 GitHub 저장소 응답을 Schema로 검증한다.
- 예상 가능한 네트워크·인증·저장소 없음 오류를 타입으로 구분한다.
- HTTP 접근을 Service 계약과 Layer 구현으로 분리한다.
- Test Layer로 네트워크 없이 업무 흐름을 검사한다.
- 여러 저장소를 제한된 동시성으로 조회하고 retry와 timeout을 적용한다.
- 구조화된 로그, Metric, Span으로 실행을 관찰한다.
- 조회 결과를 Stream으로 출력한다.

## 학습 내역

| 순서 | 파일 | 내용 | 상태 |
| --- | --- | --- | --- |
| 1 | `01-parse-repository.ts` | 외부 저장소 응답을 Schema로 검증하기 | 완료 |
| 2 | `02-domain-errors.ts` | 네트워크·인증·저장소 없음 오류 구분하기 | 완료 |
| 3 | `03-github-service.ts` | GitHub 조회 능력을 Service 계약으로 정의하기 | 완료 |
| 4 | `04-live-layer.ts` | 실제 HTTP 구현을 Layer로 제공하기 | 완료 |
| 5 | `05-test-layer.ts` | 네트워크 없는 테스트 구현 제공하기 | 예정 |
| 6 | `06-concurrent-fetch.ts` | 제한된 동시성, retry, timeout 적용하기 | 예정 |
| 7 | `07-observability.ts` | 로그, Metric, Span으로 실행 관찰하기 | 예정 |
| 8 | `08-stream-output.ts` | 여러 조회 결과를 Stream으로 출력하기 | 예정 |

## 01. 외부 저장소 응답 검증

GitHub API처럼 애플리케이션 외부에서 들어오는 데이터는 검증 전까지 `unknown`으로 유지합니다. `RepositoryResponseSchema`는 `name`, `full_name`, `stargazers_count` 필드를 검증하고, `Schema.decodeUnknownEffect`는 Schema의 성공 타입과 `SchemaError`를 가진 Effect를 만듭니다.

```text
외부 응답 unknown
→ RepositoryResponseSchema로 검증
→ 성공: 타입이 보장된 저장소 응답
→ 실패: 잘못된 필드 경로를 포함한 SchemaError
```

고정 fixture는 HTTP 문제를 섞지 않고 외부 데이터 경계를 검증하기 위한 샘플입니다. 이후 Live Layer에서는 실제 GitHub API를 호출하고, Test Layer에서는 네트워크를 대체하는 테스트 구현을 제공합니다.

## 02. 도메인 오류

GitHub 조회에서 예상 가능한 실패를 하나의 일반 `Error`로 뭉치지 않고 tagged error로 구분합니다.

```text
NetworkError         네트워크 요청 자체의 실패, 원래 cause 보존
Unauthorized         인증 실패
RepositoryNotFound   조회한 owner와 repository 보존
InvalidResponse      SchemaError를 cause로 보존
```

네 오류는 `GitHubError` union으로 묶어 GitHub 프로그램의 오류 채널에 사용합니다. 타입 수준에서는 가능한 실패 전체를 표현하고, 런타임의 `Exit.Failure`에는 실제로 발생한 오류 한 개와 해당 필드가 들어갑니다.

## 03. GitHub Service 계약

외부 API 응답과 구분되는 도메인 `Repository` 모델과 `getRepository(owner, repository)` 능력을 가진 `GitHubService` 계약을 정의합니다. 계약의 반환 타입은 `Effect<Repository, GitHubError>`입니다.

TypeScript 인터페이스는 컴파일 후 사라지므로 `Context.Service`로 Runtime이 구현을 찾을 수 있는 `GitHub` 식별자를 만듭니다. 업무 프로그램은 `Effect.service(GitHub)`로 구현을 요청하고 구체적인 HTTP 방식을 알지 않은 채 계약만 사용합니다.

```text
getRepositoryProgram
→ 성공: Repository
→ 오류: GitHubError
→ 요구사항: GitHub
```

`import type`은 오류 union을 타입으로만 재사용하며 런타임에는 import를 남기지 않습니다.

## 04. 실제 HTTP Layer

`fetch`를 `Effect.tryPromise`로 감싸 Promise rejection을 `NetworkError`로 변환합니다. `fetch`는 HTTP 404에서도 Promise가 성공하므로 상태 코드를 검사해 `RepositoryNotFound`, `Unauthorized` 같은 도메인 오류로 바꿉니다.

응답 본문은 문자열로 읽고 `Schema.fromJsonString(RepositoryResponseSchema)`로 JSON 문법과 필드 구조를 함께 검증합니다. `SchemaError`는 `InvalidResponse`로 변환하고, 검증된 snake_case 응답은 camelCase 도메인 `Repository`로 매핑합니다.

```text
fetch
→ HTTP 상태 코드 처리
→ 응답 body 문자열
→ JSON 문법 + RepositoryResponseSchema 검증
→ 외부 응답을 도메인 Repository로 변환
```

서비스 구현 객체는 Effect 없이 즉시 준비할 수 있으므로 `Layer.succeed`로 `GitHubLive`를 제공합니다. 이는 Layer 구성이 실패하지 않는다는 뜻이며, `getRepository`가 반환하는 HTTP Effect는 여전히 `GitHubError`로 실패할 수 있습니다.

## 완료 조건

- [ ] 외부 응답이 검증되기 전에는 `unknown`임을 유지한다.
- [ ] 오류 타입과 서비스 요구사항만 보고 프로그램의 실패와 의존성을 파악할 수 있다.
- [ ] 업무 프로그램이 실제 HTTP 구현을 직접 import하지 않는다.
- [ ] Test Layer로 네트워크 없이 주요 성공·실패 흐름을 검증한다.
- [ ] 동시성, retry, timeout과 자원 수명을 안전하게 관리한다.
- [ ] 실행 결과와 운영 정보를 로그, Metric, Span, Stream으로 관찰할 수 있다.
