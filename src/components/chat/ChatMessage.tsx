"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
            // Render paragraphs
            return inlinePart.split("\n\n").map((paragraph, pIndex) => (
              <p key={`${inlineIndex}-${pIndex}`} className={pIndex > 0 ? "mt-4" : ""}>
                {paragraph}
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
      </div>
    </div>
  );
}
