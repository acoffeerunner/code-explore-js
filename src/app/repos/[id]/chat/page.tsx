"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import {
  ChatMessage,
  ChatInput,
  ThinkingIndicator,
} from "@/components/chat";
import { RepoInfoPanel } from "@/components/repo";
import type { Repository } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const repoId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { messages, isLoading, isLoadingHistory, error, sendMessage } = useChat({ repoId });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && repoId) {
      loadData();
    }
  }, [user, repoId]);

  // Poll for status updates while indexing
  useEffect(() => {
    if (!repository) return;

    const isProcessing = ["pending", "cloning", "indexing"].includes(repository.status);
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getRepository(repoId);
        setRepository(updated);
        if (updated.status === "ready" || updated.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [repository?.status, repoId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const [repo, repos] = await Promise.all([
        api.getRepository(repoId),
        api.getRepositories(),
      ]);
      setRepository(repo);
      setRepositories(repos);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleViewSource = () => {
    if (repository?.url) {
      window.open(repository.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleReindex = async () => {
    if (!repository) return;
    setIsReindexing(true);
    try {
      const updated = await api.reindexRepository(repoId, true);
      setRepository(updated);
    } catch (err) {
      console.error("Failed to reindex:", err);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteRepository(repoId);
      setShowDeleteConfirm(false);
      // Brief delay for dialog close animation before redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 150);
    } catch (err) {
      console.error("Failed to delete:", err);
      setIsDeleting(false);
    }
  };

  if (authLoading || isPageLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarRepos = repositories.map((r) => ({
    id: r.id,
    name: r.name || r.url,
    status: r.status,
    lastIndexed: r.indexed_at
      ? new Date(r.indexed_at).toLocaleDateString()
      : undefined,
  }));

  const getStatusBadge = () => {
    if (!repository) return null;

    switch (repository.status) {
      case "ready":
        return <Badge variant="success">Ready</Badge>;
      case "indexing":
        return <Badge variant="warning">Indexing {repository.progress_pct}%</Badge>;
      case "cloning":
        return <Badge variant="warning">Cloning</Badge>;
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      default:
        return null;
    }
  };

  const isReady = repository?.status === "ready";
  const isProcessing = ["pending", "cloning", "indexing"].includes(repository?.status || "");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-dark">
      <Sidebar repositories={sidebarRepos} currentRepoId={repoId} />

      <main className="flex flex-1 flex-col h-full bg-background-dark relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark px-6 py-3 bg-[#120b1c]/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex items-center gap-2">
                {repository?.name || "Repository"}
                {getStatusBadge()}
              </h2>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="hidden md:flex"
              onClick={handleViewSource}
              icon={
                <span className="material-symbols-outlined text-[18px]">
                  code
                </span>
              }
            >
              View Source
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReindex}
              isLoading={isReindexing}
              disabled={isProcessing}
              icon={
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
              }
            >
              <span className="hidden lg:inline">Re-index</span>
            </Button>
            <div className="h-9 w-[1px] bg-border-dark mx-1" />
            <Button
              variant="secondary"
              size="sm"
              className="!px-2"
              onClick={() => setShowInfoPanel(true)}
            >
              <span className="material-symbols-outlined text-[20px]">
                info
              </span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="!px-2 hover:!bg-red-500/20 hover:!border-red-500/50 hover:!text-red-400"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </Button>
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Indexing Progress UI */}
          {isProcessing && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                  <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
                    {repository?.status === "cloning" ? "cloud_download" : "build"}
                  </span>
                  {repository?.status === "indexing" && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {repository?.status === "pending" && "Preparing..."}
                  {repository?.status === "cloning" && "Cloning repository..."}
                  {repository?.status === "indexing" && "Indexing codebase..."}
                </h3>
                <p className="text-text-muted mb-4">
                  {repository?.status === "cloning" && "Downloading files from the repository"}
                  {repository?.status === "indexing" && `Processing files and building search index (${repository?.progress_pct || 0}%)`}
                  {repository?.status === "pending" && "Waiting to start processing"}
                </p>
                {repository?.status === "indexing" && (
                  <div className="w-full bg-surface-dark rounded-full h-2 mb-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${repository?.progress_pct || 0}%` }}
                    />
                  </div>
                )}
                <p className="text-text-muted text-sm">
                  This may take a few minutes depending on repository size.
                </p>
              </div>
            </div>
          )}

          {/* Failed State */}
          {repository?.status === "failed" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-red-400 text-3xl">
                    error
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Indexing Failed
                </h3>
                <p className="text-text-muted mb-4">
                  {repository?.error_message || "An error occurred while processing this repository."}
                </p>
                <Button variant="primary" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Ready State - Chat Interface */}
          {isReady && (
            <>
              {isLoadingHistory ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                    progress_activity
                  </span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        chat
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Start exploring
                    </h3>
                    <p className="text-text-muted">
                      Ask questions about the codebase, request explanations, or
                      search for specific implementations.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center gap-4 my-4">
                    <div className="h-[1px] bg-border-dark flex-1" />
                    <span className="text-text-muted text-xs font-medium">
                      Today
                    </span>
                    <div className="h-[1px] bg-border-dark flex-1" />
                  </div>

                  {/* Messages */}
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {/* Thinking Indicator */}
                  {isLoading && <ThinkingIndicator message="Searching codebase..." />}

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-xl self-center">
                      {error}
                    </div>
                  )}

                  {/* Spacer for bottom input */}
                  <div className="h-24" ref={messagesEndRef} />
                </>
              )}
            </>
          )}
        </div>

        {/* Fixed Input Area - only show when ready */}
        {isReady && <ChatInput onSend={sendMessage} isLoading={isLoading} />}
      </main>

      {/* Info Panel Modal */}
      {repository && (
        <RepoInfoPanel
          isOpen={showInfoPanel}
          onClose={() => setShowInfoPanel(false)}
          repository={repository}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Repository"
        message={`Are you sure you want to delete "${repository?.name || 'this repository'}"? This will permanently remove all indexed data and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
