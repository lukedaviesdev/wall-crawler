export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export type GitHubDirectoryResponse = GitHubContentItem[];

export interface GitHubApiError {
  message: string;
  status: number;
  url: string;
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubApiResponse<T> {
  data: T;
  rateLimit?: GitHubRateLimitInfo;
  status: number;
}
