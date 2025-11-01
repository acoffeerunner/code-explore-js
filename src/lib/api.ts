import type {
  Repository,
  RepoListResponse,
  BranchesResponse,
  CreateRepoRequest,
  CreateRepoResponse,
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  SourceCitation,
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

  // Chat endpoints
  async chat(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async *chatStream(data: ChatRequest): AsyncGenerator<
    | { event: "token"; content: string }
    | { event: "done"; sources: SourceCitation[]; model: string }
    | { event: "error"; error: string }
  > {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Stream failed" }));
      throw new Error(error.detail);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7);
        } else if (line.startsWith("data: ") && currentEvent) {
          const data = JSON.parse(line.slice(6));
          if (currentEvent === "token") {
            yield { event: "token", content: data.content };
          } else if (currentEvent === "done") {
            yield { event: "done", sources: data.sources, model: data.model };
          } else if (currentEvent === "error") {
            yield { event: "error", error: data.error };
          }
          currentEvent = "";
        }
      }
    }
  }

  async getChatHistory(repoId: string, limit: number = 100, offset: number = 0): Promise<ChatHistoryResponse> {
    return this.request<ChatHistoryResponse>(`/chat/history/${repoId}?limit=${limit}&offset=${offset}`);
  }

  async clearChatHistory(repoId: string): Promise<void> {
    return this.request<void>(`/chat/history/${repoId}`, {
      method: "DELETE",
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }
}

export const api = new ApiClient();
