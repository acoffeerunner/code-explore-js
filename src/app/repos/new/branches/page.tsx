"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout";
import { BranchList } from "@/components/repo";
import type { Repository, Branch } from "@/types";

function BranchSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gitUrl = searchParams.get("url");
  const { user, loading: authLoading } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!gitUrl) {
      router.push("/dashboard");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, gitUrl]);

  const loadData = async () => {
    if (!gitUrl) return;

    setIsLoading(true);
    try {
      // Load existing repos for sidebar
      const repos = await api.getRepositories();
      setRepositories(repos);

      // Fetch branches for the new URL
      const branchResponse = await api.getBranches(gitUrl);

      if (branchResponse.error) {
        setError(branchResponse.error);
        return;
      }

      // Convert string[] to Branch[]
      const branchList: Branch[] = branchResponse.branches.map((name) => ({
        name,
        is_default: name === branchResponse.default_branch,
      }));
      setBranches(branchList);

      // Pre-select default branch
      if (branchResponse.default_branch) {
        setSelectedBranch(branchResponse.default_branch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBranch || !gitUrl) return;

    setIsCreating(true);
    setError(null);
    try {
      // Create repo with URL and selected branch - indexing starts automatically
      const repo = await api.createRepository({
        url: gitUrl,
        branch: selectedBranch,
      });
      router.push(`/repos/${repo.id}/chat`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (authLoading || isLoading) {
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

  // Extract repo name from URL for display
  const repoName = gitUrl
    ? gitUrl.match(/([^\/]+\/[^\/]+?)(?:\.git)?$/)?.[1] || gitUrl
    : "Repository";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar repositories={sidebarRepos} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-primary hover:underline"
              >
                Go back to dashboard
              </button>
            </div>
          </div>
        ) : (
          <BranchList
            branches={branches}
            selectedBranch={selectedBranch}
            onSelect={setSelectedBranch}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isLoading={isCreating}
            repoName={repoName}
          />
        )}
      </main>
    </div>
  );
}

export default function BranchSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-dark flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">
            progress_activity
          </span>
        </div>
      }
    >
      <BranchSelectionContent />
    </Suspense>
  );
}
