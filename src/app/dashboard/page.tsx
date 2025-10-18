"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout";
import { RepoInput } from "@/components/repo";
import type { Repository } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadRepositories();
    }
  }, [user]);

  const loadRepositories = async () => {
    try {
      const repos = await api.getRepositories();
      setRepositories(repos);
    } catch (err) {
      console.error("Failed to load repositories:", err);
    }
  };

  const handleSubmit = (gitUrl: string) => {
    setError(null);
    // Navigate to branch selection with URL as query param
    // Repo will be created after branch is selected
    router.push(`/repos/new/branches?url=${encodeURIComponent(gitUrl)}`);
  };

  if (authLoading) {
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-dark">
      <Sidebar repositories={sidebarRepos} />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Abstract Background Gradient */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[100px]" />
        </div>

        {/* Center Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto z-10">
          {/* Hero Text */}
          <div className="text-center mb-10 max-w-2xl">
            <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-surface-dark border border-slate-700/50 shadow-sm">
              <span className="text-xs text-slate-400">
                Now supporting Python, Java, JS, TS, C# &amp; Go
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              What code are we
              <br />
              exploring today?
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-normal">
              Enter a Git repository URL to start a RAG-powered analysis
              session.
              <br className="hidden md:block" />
              Ask questions, generate docs, and find bugs instantly.
            </p>
          </div>

          {/* Input Area */}
          <RepoInput onSubmit={handleSubmit} />

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-2xl">
              {error}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="absolute bottom-6 w-full text-center">
          <p className="text-xs text-slate-600 dark:text-slate-500">
            CodeExplore AI can make mistakes. Please verify important logic.
          </p>
        </div>
      </main>
    </div>
  );
}
