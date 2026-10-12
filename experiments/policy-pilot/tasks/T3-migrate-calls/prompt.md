`src/http.js`의 deprecated 함수 `oldFetch(url, options)`를 이 저장소 안에서 더 이상 직접 호출하지 않도록 `fetchJson({ url, ...options })`로 옮겨 줘.

- `src/http.js`에서 가져온 `oldFetch`를 직접 호출하는 모든 곳이 대상이다. 다른 이름으로 import했거나 namespace import로 부르는 경우도 포함한다. options가 없으면 `fetchJson({ url })` 형태로 쓴다.
- `oldFetch` 자체는 외부 사용자를 위해 `src/http.js`에 그대로 export 상태로 둔다.
- 주석, 문자열, 변수 이름, 그리고 `src/http.js`와 관계없는 다른 객체의 `oldFetch` 메서드 호출은 바꾸지 않는다.
- 동작은 바뀌면 안 된다. 쓰이지 않게 된 import는 정리한다.

끝나면 무엇을 바꿨고 무엇을 확인했는지 짧게 알려줘.
