# repo-providers

저장소 서비스에 연결하는 TypeScript 패키지입니다  
지금은 Bitbucket Cloud만 지원합니다

## 기능

- **`BitbucketApiClient`**: 워크스페이스, 레포, 브랜치를 조회하고 PR을 열거나 갱신합니다
- **`loadBitbucketCredentials`**: 맥 키체인에서 Bitbucket 토큰을 읽습니다
- **`syncRepo`**: 레포를 clone하거나, 이미 있으면 원격 브랜치의 최신 상태로 맞춥니다
- **`RepoProvider`**: 저장소 서비스마다 구현하는 공통 인터페이스

PR 리뷰어는 `{uuid}`나 `account_id`로 적습니다  
닉네임으로 적으려면 토큰에 `read:workspace` 권한이 필요합니다

## 설치

```sh
npm install "@yonggipo/repo-providers@git+https://github.com/yonggipo/repo-providers.git#v0.2.0"
```

```ts
import { BitbucketApiClient, syncRepo } from "@yonggipo/repo-providers";
```

## 개발

```sh
npm run typecheck && npm test
npm version patch -m "🔖 release: v%s"
git push --follow-tags
```

설치하는 쪽이 빌드 스크립트를 막아도 쓸 수 있도록, `npm version`이 `dist/`를 빌드해 버전 커밋에 함께 넣습니다
