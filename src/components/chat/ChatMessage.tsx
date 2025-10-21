"use client";

import type { ChatMessage as ChatMessageType, DisplaySource } from "@/types";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Citation badge component
function CitationBadge({ number, text }: { number: string; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-primary/20 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/30 transition-colors cursor-default"
      title={text}
    >
      <span className="material-symbols-outlined text-[14px]">description</span>
      <span className="max-w-[200px] truncate">{text}</span>
      <span className="text-xs opacity-70">[{number}]</span>
    </span>
  );
}

// Source item component
function SourceItem({ source, index }: { source: DisplaySource; index: number }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-dark/50 border border-border-dark hover:border-primary/30 transition-colors">
      <span className="flex items-center justify-center h-5 w-5 rounded bg-primary/20 text-primary text-xs font-bold shrink-0">
        {index + 1}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-white font-medium truncate">
          {source.file_path}
        </span>
        <span className="text-xs text-text-muted">
          Lines {source.start_line}–{source.end_line}
          {source.symbol_name && (
            <span className="ml-2 text-primary">({source.symbol_name})</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Parse citations in format [text][number] and render as badges
  const renderTextWithCitations = (text: string) => {
    // Match patterns like [filename lines X-Y][N] or just [N]
    const citationRegex = /\[([^\]]+)\]\[(\d+)\]|\[(\d+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // Full citation: [text][number]
        parts.push(
          <CitationBadge key={match.index} text={match[1]} number={match[2]} />
        );
      } else if (match[3]) {
        // Simple citation: [number]
        parts.push(
          <span
            key={match.index}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-primary/20 text-primary text-xs font-bold"
          >
            {match[3]}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Simple markdown-like rendering for AI responses
  const renderContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if it's a code block
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const [, language = "text", code] = match;
          return (
            <CodeBlock key={index} language={language} code={code.trim()} />
          );
        }
      }

      // Check for inline code
      const inlineCodeParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineCodeParts.map((inlinePart, inlineIndex) => {
            if (inlinePart.startsWith("`") && inlinePart.endsWith("`")) {
              return (
                <code
                  key={inlineIndex}
                  className="bg-surface-dark border border-border-dark px-1.5 py-0.5 rounded text-primary font-mono text-sm"
                >
                  {inlinePart.slice(1, -1)}
                </code>
              );
            }
            // Render paragraphs with citation parsing
            return inlinePart.split("\n\n").map((paragraph, pIndex) => (
              <p key={`${inlineIndex}-${pIndex}`} className={pIndex > 0 ? "mt-4" : ""}>
                {renderTextWithCitations(paragraph)}
              </p>
            ));
          })}
        </span>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex items-end gap-3 justify-end self-end max-w-3xl w-full">
        <div className="flex flex-col gap-1 items-end w-full">
          <div className="text-base font-normal leading-relaxed rounded-2xl rounded-tr-sm px-5 py-3.5 bg-primary text-white shadow-lg shadow-purple-900/20">
            {message.content}
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 shrink-0 border border-white/10" />
      </div>
    );
  }

  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className="flex items-start gap-4 max-w-4xl w-full self-start">
      <div className="h-8 w-8 rounded-full bg-[#31204b] flex items-center justify-center shrink-0 border border-border-dark text-primary shadow-glow-sm">
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">CodeExplore AI</span>
        </div>
        <div className="text-gray-300 text-base leading-relaxed space-y-4">
          {renderContent(message.content)}
        </div>

        {/* Sources list */}
        {hasSources && (
          <div className="mt-4 pt-4 border-t border-border-dark">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                source
              </span>
              <span className="text-sm font-medium text-text-muted">
                Sources ({message.sources!.length})
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.sources!.map((source, index) => (
                <SourceItem key={index} source={source} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
