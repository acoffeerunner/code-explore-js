"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType, DisplaySource } from "@/types";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Simple superscript citation - just the number
function CitationNumber({ number, text }: { number: string; text: string }) {
  return (
    <sup
      className="inline-flex items-center justify-center ml-0.5 px-1 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold cursor-help hover:bg-primary/30 transition-colors"
      title={text}
    >
      {number}
    </sup>
  );
}

// Source item component - compact inline chip
function SourceItem({ source, index }: { source: DisplaySource; index: number }) {
  // Extract just the filename from the path
  const fileName = source.file_path.split('/').pop() || source.file_path;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-dark/50 border border-border-dark hover:border-primary/30 transition-colors text-xs whitespace-nowrap"
      title={source.file_path}
    >
      <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-primary/20 text-primary text-[10px] font-bold">
        {index + 1}
      </span>
      <span className="text-text-muted">{fileName}</span>
      <span className="text-text-muted/60">
        L{source.start_line}-{source.end_line}
      </span>
    </span>
  );
}

// Collapsible sources section
function SourcesSection({ sources }: { sources: DisplaySource[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewCount = 3;
  const hasMore = sources.length > previewCount;

  const displayedSources = isExpanded ? sources : sources.slice(0, previewCount);

  return (
    <div className="mt-3 pt-3 border-t border-border-dark/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-2"
      >
        <span className="material-symbols-outlined text-[14px]">
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
        <span className="text-xs font-medium">
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </span>
      </button>

      <div className="flex flex-wrap gap-1.5">
        {displayedSources.map((source, index) => (
          <SourceItem key={index} source={source} index={index} />
        ))}
        {!isExpanded && hasMore && (
          <button
            onClick={() => setIsExpanded(true)}
            className="px-2 py-1.5 rounded bg-surface-dark/50 border border-border-dark text-text-muted text-xs hover:text-white hover:border-primary/30 transition-colors"
          >
            +{sources.length - previewCount} more
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Parse citations in format [text][number] or [number] and render as superscript numbers
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
        // Full citation: [text][number] - show just the number, text in tooltip
        parts.push(
          <CitationNumber key={match.index} text={match[1]} number={match[2]} />
        );
      } else if (match[3]) {
        // Simple citation: [number]
        parts.push(
          <CitationNumber key={match.index} text={`Source ${match[3]}`} number={match[3]} />
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

        {/* Collapsible Sources list */}
        {hasSources && (
          <SourcesSection sources={message.sources!} />
        )}
      </div>
    </div>
  );
}
