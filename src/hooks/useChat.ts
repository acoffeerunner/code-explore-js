"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import type { ChatMessage, DisplaySource, SourceCitation } from "@/types";

interface UseChatOptions {
  repoId: string;
  enabled?: boolean; // Wait for auth before loading history
}

// Helper to map backend sources to display format
function mapSourcesToDisplay(sources: SourceCitation[] | null): DisplaySource[] | undefined {
  if (!sources || sources.length === 0) return undefined;
  return sources.map((s) => ({
    file_path: s.file,
    start_line: s.line_start,
    end_line: s.line_end,
    symbol_name: s.symbol_name,
    score: s.score,
  }));
}

export function useChat({ repoId, enabled = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load chat history when enabled (after auth is ready)
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    async function loadHistory() {
      try {
        const history = await api.getChatHistory(repoId);
        if (isMounted) {
          const loadedMessages: ChatMessage[] = history.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            sources: mapSourcesToDisplay(m.sources),
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        // Don't set error - just start with empty chat
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [repoId, enabled]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Build history from recent messages
      const recentHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Create placeholder assistant message for streaming
      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        for await (const event of api.chatStream({
          question: content.trim(),
          repo_id: repoId,
          history: recentHistory,
        })) {
          if (event.event === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            );
          } else if (event.event === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, sources: mapSourcesToDisplay(event.sources) }
                  : m
              )
            );
          } else if (event.event === "error") {
            throw new Error(event.error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id && m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [repoId, messages]
  );

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setError(null);
    try {
      await api.clearChatHistory(repoId);
    } catch (err) {
      console.error("Failed to clear chat history on server:", err);
    }
  }, [repoId]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearMessages,
  };
}
