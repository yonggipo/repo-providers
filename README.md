# repo-providers

저장소 서비스(Bitbucket, GitHub)에 연결하는 코드를 `auto-qa-agent`와 `api-doc-cli`가 함께 쓰려고 만든 개인 패키지입니다  
지금은 Bitbucket 연결부만 있습니다

## 들어 있는 것

- **`RepoProvider`**: 저장소 서비스마다 구현하는 공통 약속
- **`BitbucketApiClient`**: Bitbucket Cloud API로 계정, 워크스페이스, 레포, 브랜치를 조회하고 git 인증 환경변수를 만듭니다  
  `openPullRequest`는 PR을 열고, 같은 브랜치의 열린 PR이 있으면 그 PR의 제목, 본문, 리뷰어를 바꿉니다  
  리뷰어는 `{uuid}`나 `account_id`로 적거나, 워크스페이스 멤버의 닉네임이나 표시 이름으로 적습니다, 찾지 못한 이름이 있으면 PR을 열지 않고 멈춥니다  
  이름으로 적으면 멤버를 조회하므로 토큰에 `read:workspace` 권한이 필요하고, PR을 여는 계정을 리뷰어에서 빼려면 계정 읽기 권한이 필요합니다
- **`loadBitbucketCredentials`**: 맥 키체인에서 Bitbucket 토큰을 읽습니다, 앱이 저장한 항목을 먼저 보고 없으면 공용 항목 `bitbucket-api-token`을 읽습니다
- **`syncRepo`**: 레포를 정한 폴더에 clone하고, 이미 있으면 원격 브랜치의 최신 상태로 맞춥니다

## 설치

비공개 저장소이므로 받는 컴퓨터의 git이 GitHub에 로그인되어 있어야 합니다  
이 맥은 `gh auth login`으로 로그인해 두었고, git이 https로 접속할 때 `gh`의 로그인 정보를 씁니다

```sh
npm install "@yonggipo/repo-providers@git+https://github.com/yonggipo/repo-providers.git#v0.1.1"
```

npm은 `package.json`에 `github:yonggipo/repo-providers#v0.1.1`로 줄여 적고, 받을 때 SSH로 먼저 접속한 뒤 실패하면 https로 다시 받습니다  
그래서 SSH 키를 GitHub에 등록하지 않은 이 맥에서도 받아 집니다

```ts
import { BitbucketApiClient, syncRepo } from "@yonggipo/repo-providers";
```

## 빌드

Node는 `node_modules` 안의 `.ts` 파일을 실행하지 않으므로 `dist/`에 JavaScript로 빌드해서 내보냅니다  
`api-doc-cli`처럼 `.npmrc`에 `ignore-scripts=true`를 둔 저장소는 설치할 때 패키지 쪽 빌드 스크립트를 실행하지 않으므로, 빌드한 `dist/`를 이 저장소에 함께 커밋합니다  
`npm version`이 `version` 스크립트로 먼저 빌드하고 `dist/`를 버전 커밋에 넣으므로 손으로 빌드하지 않습니다

## 새 버전 내기

```sh
npm run typecheck && npm test
npm version patch -m "🔖 release: v%s"    # 빌드하고, 버전을 올리고, v0.1.1 같은 태그를 만듭니다
git push --follow-tags
```

받는 쪽은 위 설치 명령을 새 태그로 다시 실행합니다, `package.json`의 태그만 고치면 잠금 파일이 예전 커밋을 그대로 가리킵니다  
태그를 바꾸기 전까지는 예전 버전을 그대로 씁니다

패키지를 고치면서 받는 쪽에서 바로 시험하려면, 받는 쪽 폴더에서 `npm link ../repo-providers`로 이 폴더를 잠시 겁니다  
링크로 걸면 `dist/`를 읽으므로 고친 뒤 `npm run build`를 다시 합니다, 시험이 끝나면 `npm install`로 되돌립니다

## 코드 규칙

`auto-qa-agent`에서 옮겨 온 코드라 그 저장소의 `docs/code-conventions.md`를 따릅니다  
테스트는 실제 코드 옆에 `<파일 이름>.test.ts`로 둡니다
