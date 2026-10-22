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
}
