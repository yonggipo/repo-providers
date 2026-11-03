// 저장소 서비스 공통 약속: 화면과 명령은 이 모양만 보고 서비스를 쓴다

export type RepoProviderId = "bitbucket" | "github";

// 저장소 서비스에서 가져온 레포 한 개
export interface Repo {
  // Bitbucket 은 워크스페이스, GitHub 은 사용자나 조직 이름
  owner: string;
  slug: string;
  fullName: string;
  description: string;
  language: string;
  mainBranch: string | null;
  updatedOn: string;
  isPrivate: boolean;
  // 사용자 이름과 토큰이 붙지 않은 https 주소
  cloneUrl: string;
}

// 저장소 서비스마다 갖춰야 하는 기능
export interface RepoProvider {
  readonly id: RepoProviderId;

  // 연동된 계정의 표시 이름
  currentUserName(): Promise<string>;

  // 레포를 묶는 단위 목록, Bitbucket 은 워크스페이스
  listOwners(): Promise<string[]>;

  // 한 묶음 안에서 볼 수 있는 레포 목록, 최근에 고친 순서
  listRepos(owner: string): Promise<Repo[]>;

  // 레포의 브랜치 이름 목록, 최근에 커밋한 순서
  listBranches(repo: Repo): Promise<string[]>;

  // git clone 과 fetch 에 넘길 인증 환경변수
  gitAuthEnv(): NodeJS.ProcessEnv;

  // source 브랜치를 destination 브랜치로 합치는 PR 을 연다
  // 같은 source 브랜치의 열린 PR 이 있으면 새로 만들지 않고 그 PR 의 제목, 본문, 리뷰어를 바꾼다
  openPullRequest(request: PullRequestRequest): Promise<PullRequestResult>;
}

// PR 을 열 때 넘기는 값
export interface PullRequestRequest {
  // `워크스페이스/레포`
  repo: string;
  source: string;
  destination: string;
  title: string;
  description: string;
  // 리뷰어로 넣을 사람, 서비스의 사용자 ID 나 닉네임, 표시 이름
  reviewers: string[];
}

// 연 PR
export interface PullRequestResult {
  id: number;
  url: string;
  // 이미 열린 PR 을 고쳤으면 false
  created: boolean;
  // PR 을 여는 계정은 리뷰어가 될 수 없어 뺀 이름
  skippedReviewers: string[];
}
