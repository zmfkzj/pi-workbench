`src/log.js`의 deprecated 함수 `log(level, message, context)` 호출을 새 API `logger`로 모두 옮겨 줘. 4.0에서 `log`를 deprecated로 만들었고 다음 메이저 버전에서 지우려 한다.

- `src/log.js`에서 가져온 `log`를 호출하는 모든 곳이 대상이다. 다른 이름으로 import했거나(`import { log as x }`) namespace import로 부르는 경우도 포함한다.
- 레벨이 문자열 리터럴이면 `logger.<level>(message, context)` 형태로 바꾼다. 레벨이 변수 같은 식이면 `logger[level](message, context)` 형태로 바꾼다. 원래 인자가 두 개면 두 개를 그대로 넘긴다.
- `src/log.js` 자체는 바꾸지 않는다. 외부 플러그인 때문에 `log` export는 남긴다.
- 이름이 `log`이지만 `src/log.js`의 함수가 아닌 것(매개변수, 지역 변수, 다른 객체의 메서드)과 주석·문자열 안의 텍스트는 바꾸지 않는다.
- 쓰지 않게 된 import는 정리한다. 동작은 바뀌면 안 된다.

끝나면 무엇을 바꿨고 무엇을 확인했는지 짧게 알려줘.
