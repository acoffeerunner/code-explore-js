"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout";
import { Badge, Button } from "@/components/ui";
import {
  ChatMessage,
  ChatInput,
  ThinkingIndicator,
} from "@/components/chat";
import type { Repository } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const repoId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { messages, isLoading, error, sendMessage } = useChat({ repoId });
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
    name: r.name,
    status: r.status,
    lastIndexed: r.indexed_at
      ? new Date(r.indexed_at).toLocaleDateString()
      : undefined,
  }));

  const getStatusBadge = () => {
    if (!repository) return null;

    switch (repository.status) {
      case "indexed":
        return <Badge variant="success">Indexed</Badge>;
      case "indexing":
        return <Badge variant="warning">Indexing</Badge>;
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      default:
        return null;
    }
  };

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
              icon={
                <span className="material-symbols-outlined text-[18px]">
                  refresh
                </span>
              }
            >
              <span className="hidden lg:inline">Re-index</span>
            </Button>
            <div className="h-9 w-[1px] bg-border-dark mx-1" />
            <Button variant="secondary" size="sm" className="!px-2">
              <span className="material-symbols-outlined text-[20px]">
                share
              </span>
            </Button>
            <Button variant="secondary" size="sm" className="!px-2">
              <span className="material-symbols-outlined text-[20px]">
                info
              </span>
            </Button>
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {messages.length === 0 ? (
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
        </div>

        {/* Fixed Input Area */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
