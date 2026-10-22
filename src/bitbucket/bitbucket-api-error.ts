// Bitbucket API 가 실패 응답을 줬을 때 던지는 오류
export class BitbucketApiError extends Error {
  readonly status: number;

  constructor(status: number, body: string) {
    super(explainStatus(status, body));
    this.status = status;
  }
}

// 상태 코드를 사용자가 바로 할 일을 알 수 있는 문장으로 바꾼다
function explainStatus(status: number, body: string): string {
  const detail = body.slice(0, 300);
  if (status === 401) return "인증 실패: 이메일이나 API 토큰이 맞지 않습니다";
  if (status === 403) return `권한 부족: 토큰에 필요한 범위(scope)가 없습니다\n${detail}`;
  if (status === 410) return `Bitbucket 이 없앤 API 입니다\n${detail}`;
  return `Bitbucket 응답 ${status}\n${detail}`;
}
