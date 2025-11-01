// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Repository types (matches backend RepoResponse)
export interface Repository {
  id: string;
  url: string;
  branch: string;
  status: "pending" | "cloning" | "indexing" | "ready" | "failed";
  progress_pct: number;
  branches_available: string[] | null;
  error_message: string | null;
  file_count: number | null;
  chunk_count: number | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
  indexed_at: string | null;
  // Derived field for display
  name?: string;
}

export interface RepoListResponse {
  items: Repository[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Backend returns branches as simple strings, with default_branch separately
export interface BranchesResponse {
  url: string;
  default_branch: string;
  branches: string[];
  is_public: boolean;
  error?: string;
}

// Simple branch for UI display
export interface Branch {
  name: string;
  is_default: boolean;
}

// Source citation from backend RAG response
export interface SourceCitation {
  chunk_id: string;
  file: string;
  line_start: number;
  line_end: number;
  symbol_name: string | null;
  score: number;
}

// Mapped source for UI display
export interface DisplaySource {
  file_path: string;
  start_line: number;
  end_line: number;
  symbol_name: string | null;
  score: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: DisplaySource[];
}

// Backend chat message response (before mapping sources)
export interface ChatMessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceCitation[] | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessageResponse[];
  total: number;
}

// API request/response types
export interface CreateRepoRequest {
  url: string;
  branch: string;
  webhook_url?: string;
}

// CreateRepoResponse is just a Repository (backend returns RepoResponse directly)
export type CreateRepoResponse = Repository;

export interface ChatRequest {
  repo_id: string;
  question: string;
  model?: string;
  top_k?: number;
  history?: Array<{ role: string; content: string }>;
}

// Backend ChatResponse structure
export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// API error type
export interface ApiError {
  detail: string;
}
