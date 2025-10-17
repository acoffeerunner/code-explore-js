"use client";

interface ThinkingIndicatorProps {
  message?: string;
}

export default function ThinkingIndicator({
  message = "Thinking...",
}: ThinkingIndicatorProps) {
  return (
    <div className="flex items-start gap-4 max-w-4xl w-full self-start">
      <div className="h-8 w-8 rounded-full bg-[#31204b] flex items-center justify-center shrink-0 border border-border-dark text-primary">
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">CodeExplore AI</span>
        </div>
        <div className="flex items-center gap-3 bg-surface-dark/50 p-3 rounded-lg border border-border-dark/50 w-fit">
          <span className="material-symbols-outlined text-primary animate-spin text-[20px]">
            progress_activity
          </span>
          <span className="text-text-muted text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
}
