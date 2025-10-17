"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ask a question about this repository...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-40">
      <div className="max-w-4xl mx-auto w-full relative">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 bg-surface-dark rounded-xl border border-border-dark shadow-2xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all"
        >
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-white text-base p-4 min-h-[60px] max-h-[200px] resize-none focus:ring-0 placeholder-text-muted/70"
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1" />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="flex items-center justify-center h-9 w-9 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_upward
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-text-muted mt-2">
          AI can make mistakes. Verify code snippets in the source.
        </p>
      </div>
    </div>
  );
}
