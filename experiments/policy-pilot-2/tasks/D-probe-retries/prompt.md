버그 신고: 결제 게이트웨이 프로브가 재시도를 하지 말아야 하는데 4번 시도한다.

```
$ node bin/probe.js --config examples/fail-fast.conf
url: https://pay.internal/health#status
timeout_ms: 1000
attempts: 4
```

설정 파일에는 `retries: 0`, `timeout_ms: 250`이 있으니 `attempts: 1`, `timeout_ms: 250`이어야 한다. 원인을 찾아 고쳐 줘. 설정 형식은 README에 있다.

끝나면 무엇을 바꿨고 무엇을 확인했는지 짧게 알려줘.
