"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout";
import { BranchList } from "@/components/repo";
import type { Repository, Branch } from "@/types";

export default function BranchSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const repoId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && repoId) {
      loadData();
    }
  }, [user, repoId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [repo, repos] = await Promise.all([
        api.getRepository(repoId),
        api.getRepositories(),
      ]);

      setRepository(repo);
      setRepositories(repos);

      // Load branches
      const branchList = await api.getBranches(repo.git_url);
      setBranches(branchList);

      // Pre-select default branch
      const defaultBranch = branchList.find((b) => b.is_default);
      if (defaultBranch) {
        setSelectedBranch(defaultBranch.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBranch) return;

    setIsIndexing(true);
    try {
      await api.indexRepository(repoId, { branch: selectedBranch });
      router.push(`/repos/${repoId}/chat`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start indexing");
      setIsIndexing(false);
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
    name: r.name,
    status: r.status,
    lastIndexed: r.indexed_at
      ? new Date(r.indexed_at).toLocaleDateString()
      : undefined,
  }));

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar repositories={sidebarRepos} currentRepoId={repoId} />

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
            isLoading={isIndexing}
            repoName={repository?.name}
          />
        )}
      </main>
    </div>
  );
}
