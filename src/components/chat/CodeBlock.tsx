"use client";

import { useState } from "react";

interface CodeBlockProps {
  language?: string;
  code: string;
  filename?: string;
}

export default function CodeBlock({
  language = "text",
  code,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for common patterns
  const highlightCode = (code: string) => {
    // This is a simplified highlighter - in production you'd use a library like Prism or Shiki
    let highlighted = code;

    // Keywords
    const keywords = [
      "function",
      "const",
      "let",
      "var",
      "return",
      "if",
      "else",
      "for",
      "while",
      "class",
      "import",
      "export",
      "from",
      "async",
      "await",
      "try",
      "catch",
      "throw",
      "new",
      "this",
      "super",
      "extends",
      "implements",
      "interface",
      "type",
      "enum",
      "def",
      "self",
      "True",
      "False",
      "None",
      "and",
      "or",
      "not",
      "in",
      "is",
      "lambda",
      "with",
      "as",
      "pass",
      "break",
      "continue",
      "yield",
      "raise",
    ];

    return highlighted;
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border-dark bg-[#0d0915] mt-2">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-dark border-b border-border-dark">
        <span className="text-xs text-text-muted font-mono">
          {filename || language}
        </span>
        <button
          onClick={handleCopy}
          className="text-text-muted hover:text-white flex items-center gap-1 text-xs transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-6">
          <code className="text-gray-300">{code}</code>
        </pre>
      </div>
    </div>
  );
}
