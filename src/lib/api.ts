import type {
  Repository,
  Branch,
  CreateRepoRequest,
  CreateRepoResponse,
  IndexRepoRequest,
  ChatRequest,
  ChatResponse,
  ApiError,
} from "@/types";

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
    return this.request<CreateRepoResponse>("/repos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getRepositories(): Promise<Repository[]> {
    return this.request<Repository[]>("/repos");
  }

  async getRepository(id: string): Promise<Repository> {
    return this.request<Repository>(`/repos/${id}`);
  }

  async indexRepository(id: string, data: IndexRepoRequest): Promise<void> {
    return this.request<void>(`/repos/${id}/index`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteRepository(id: string): Promise<void> {
    return this.request<void>(`/repos/${id}`, {
      method: "DELETE",
    });
  }

  // Git endpoints
  async getBranches(gitUrl: string): Promise<Branch[]> {
    const params = new URLSearchParams({ url: gitUrl });
    return this.request<Branch[]>(`/git/branches?${params}`);
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
