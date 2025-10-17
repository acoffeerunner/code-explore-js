// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Repository types
export interface Repository {
  id: string;
  user_id: string;
  git_url: string;
  name: string;
  default_branch: string;
  status: "pending" | "indexing" | "indexed" | "failed";
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  name: string;
  sha: string;
  is_default: boolean;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: CodeSource[];
}

export interface CodeSource {
  file_path: string;
  start_line: number;
  end_line: number;
  content: string;
  score: number;
}

// API request/response types
export interface CreateRepoRequest {
  git_url: string;
}

export interface CreateRepoResponse {
  repository: Repository;
  branches: Branch[];
}

export interface IndexRepoRequest {
  branch: string;
}

export interface ChatRequest {
  message: string;
  repo_id: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

// API error type
export interface ApiError {
  detail: string;
}
