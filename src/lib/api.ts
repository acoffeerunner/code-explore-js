import type {
  Repository,
  RepoListResponse,
  BranchesResponse,
  CreateRepoRequest,
  CreateRepoResponse,
  ChatRequest,
  ChatResponse,
  ApiError,
} from "@/types";

// Helper to extract repo name from URL
function extractRepoName(url: string): string {
  try {
    // Handle GitHub URLs like https://github.com/owner/repo or git@github.com:owner/repo.git
    const match = url.match(/(?:github\.com[\/:]|gitlab\.com[\/:]|bitbucket\.org[\/:])?([^\/]+\/[^\/]+?)(?:\.git)?$/);
    return match ? match[1] : url;
  } catch {
    return url;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "An unknown error occurred",
      }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  // Repository endpoints
  async createRepository(data: CreateRepoRequest): Promise<CreateRepoResponse> {
    const repo = await this.request<CreateRepoResponse>("/repos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      ...repo,
      name: extractRepoName(repo.url),
    };
  }

  async getRepositories(): Promise<Repository[]> {
    const response = await this.request<RepoListResponse>("/repos");
    // Add derived name field from URL
    return response.items.map((repo) => ({
      ...repo,
      name: extractRepoName(repo.url),
    }));
  }

  async getRepository(id: string): Promise<Repository> {
    const repo = await this.request<Repository>(`/repos/${id}`);
    return {
      ...repo,
      name: extractRepoName(repo.url),
    };
  }

  async deleteRepository(id: string): Promise<void> {
    return this.request<void>(`/repos/${id}`, {
      method: "DELETE",
    });
  }

  async reindexRepository(id: string, force: boolean = false): Promise<Repository> {
    const repo = await this.request<Repository>(`/repos/${id}/reindex`, {
      method: "POST",
      body: JSON.stringify({ force }),
    });
    return {
      ...repo,
      name: extractRepoName(repo.url),
    };
  }

  // Git endpoints
  async getBranches(gitUrl: string): Promise<BranchesResponse> {
    return this.request<BranchesResponse>("/git/branches", {
      method: "POST",
      body: JSON.stringify({ url: gitUrl }),
    });
  }

  // Chat endpoint
  async chat(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }
}

export const api = new ApiClient();
