"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface RepoInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export default function RepoInput({
  onSubmit,
  isLoading = false,
}: RepoInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const handleSuggestionClick = (repoUrl: string) => {
    setUrl(repoUrl);
    onSubmit(repoUrl);
  };

  const suggestions = [
    { icon: "code", name: "facebook/react", url: "https://github.com/facebook/react" },
    { icon: "terminal", name: "torvalds/linux", url: "https://github.com/torvalds/linux" },
    { icon: "deployed_code", name: "pallets/flask", url: "https://github.com/pallets/flask" },
  ];

  return (
    <div className="w-full max-w-2xl">
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative group/input mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-25 group-hover/input:opacity-50 transition duration-500" />
        <div className="relative flex w-full items-center bg-white dark:bg-[#1f1a2e] border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl overflow-hidden h-16 transition-transform focus-within:scale-[1.01]">
          {/* Icon */}
          <div className="pl-5 pr-3 text-slate-400">
            <span className="material-symbols-outlined">link</span>
          </div>
          {/* Input */}
          <input
            autoFocus
            className="w-full h-full bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none text-base md:text-lg font-mono"
            placeholder="https://github.com/username/repository"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {/* Button */}
          <div className="pr-2">
            <Button
              type="submit"
              isLoading={isLoading}
              icon={
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              }
              iconPosition="right"
            >
              Analyze
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Or try a popular repository:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.name}
              onClick={() => handleSuggestionClick(suggestion.url)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1f1a2e] border border-slate-200 dark:border-slate-700/50 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-[#2a243d] transition-all group"
            >
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[18px]">
                {suggestion.icon}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                {suggestion.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
