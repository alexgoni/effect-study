# 용어 정리

학습한 개념을 자신의 언어로 정리합니다.

## Fiber

Effect runtime이 Effect 프로그램의 실행을 관리하는 가벼운 논리적 실행 단위다. 운영체제 thread나 JavaScript Worker가 아니라 runtime이 JavaScript 이벤트 루프 위에서 스케줄링한다.

Fiber는 현재 실행 상태, 완료 결과인 `Exit`, 필요한 서비스 Context, 중단 신호와 finalizer 같은 정보를 가진다. `Effect.fork`로 자식 Fiber를 시작하고, `Fiber.join`으로 결과를 기다리며, `Fiber.interrupt`로 협력적으로 중단할 수 있다.

```text
Effect 프로그램
→ runtime이 Fiber에서 실행
→ 성공 또는 실패를 Exit으로 완료
```

`runSync`나 `runPromise`로 시작한 최상위 실행도 root Fiber에서 수행된다. 자식 Fiber와 자원의 수명을 부모 실행 범위에 연결하면 부모가 종료되거나 중단될 때 관련 작업과 finalizer를 함께 관리할 수 있다.
