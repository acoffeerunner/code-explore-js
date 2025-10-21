"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

interface Repository {
  id: string;
  name: string;
  status: "pending" | "cloning" | "indexing" | "ready" | "failed";
  lastIndexed?: string;
}

interface SidebarProps {
  repositories?: Repository[];
  currentRepoId?: string;
}

export default function Sidebar({
  repositories = [],
  currentRepoId,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Get user display info
  const getUserInfo = () => {
    if (!user) return { name: null, email: null, avatar: null, provider: null };

    const provider = user.app_metadata?.provider as string | undefined;
    const metadata = user.user_metadata || {};

    return {
      name: metadata.full_name || metadata.name || null,
      email: user.email || null,
      avatar: metadata.avatar_url || null,
      provider: provider && provider !== "email" ? provider : null,
    };
  };

  const userInfo = getUserInfo();

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      router.push("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const getStatusIcon = (status: Repository["status"]) => {
    switch (status) {
      case "ready":
        return "code";
      case "indexing":
        return "sync";
      case "cloning":
        return "download";
      case "pending":
        return "dataset";
      case "failed":
        return "error";
      default:
        return "account_tree";
    }
  };

  const getStatusText = (repo: Repository) => {
    switch (repo.status) {
      case "ready":
        return repo.lastIndexed ? `Ready ${repo.lastIndexed}` : "Ready";
      case "indexing":
        return "Indexing...";
      case "cloning":
        return "Cloning...";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return "";
    }
  };

  return (
    <aside className="w-[320px] flex flex-col border-r border-border-dark bg-[#120b1c] shrink-0 z-20 h-full">
      {/* Sidebar Header */}
      <div className="p-4 pb-0 flex flex-col gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary/20 flex items-center justify-center aspect-square rounded-xl size-10 border border-primary/30 text-primary">
            <span className="material-symbols-outlined text-[24px]">
              terminal
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-lg font-bold leading-none tracking-tight">
              CodeExplore
            </h1>
            <p className="text-text-muted text-xs font-normal mt-1">
              RAG Code Analysis
            </p>
          </div>
        </Link>

        {/* New Repo Button */}
        <Link href="/dashboard">
          <Button
            variant="primary"
            className="w-full shadow-glow"
            icon={
              <span className="material-symbols-outlined text-[20px]">add</span>
            }
          >
            New Repository
          </Button>
        </Link>

        {/* Search */}
        <div className="relative group">
          <input
            className="w-full bg-surface-dark border border-border-dark text-white text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 pl-10 placeholder-text-muted transition-all"
            placeholder="Filter repositories..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-symbols-outlined text-text-muted text-[20px]">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Repository List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        <p className="text-text-muted text-xs font-bold uppercase tracking-wider px-2 mb-1">
          Recent
        </p>

        {repositories.map((repo) => {
          const isActive = repo.id === currentRepoId;
          const isIndexing = repo.status === "indexing" || repo.status === "cloning";

          return (
            <Link
              key={repo.id}
              href={`/repos/${repo.id}/chat`}
              className={`
                flex items-center gap-3 p-3 rounded-lg border group text-left w-full transition-all
                ${
                  isActive
                    ? "bg-surface-dark border-primary/50 relative overflow-hidden"
                    : "border-transparent hover:bg-surface-dark hover:border-border-dark"
                }
                ${isIndexing ? "opacity-75" : ""}
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div
                className={`
                p-1.5 rounded-md flex shrink-0 relative
                ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-white/5 text-text-muted group-hover:text-white"
                }
              `}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {getStatusIcon(repo.status)}
                </span>
                {isIndexing && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-none truncate transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-text-muted group-hover:text-white"
                  }`}
                >
                  {repo.name}
                </p>
                <p
                  className={`text-xs mt-1 truncate ${
                    isActive
                      ? "text-primary"
                      : isIndexing
                        ? "text-orange-400"
                        : "text-text-muted/60"
                  }`}
                >
                  {isActive ? "Active Now" : getStatusText(repo)}
                </p>
              </div>
            </Link>
          );
        })}

        {repositories.length === 0 && (
          <p className="text-text-muted text-sm px-2 py-4 text-center">
            No repositories yet. Add one to get started.
          </p>
        )}
      </div>

      {/* Sidebar Footer - User Menu */}
      <div className="p-4 border-t border-border-dark" ref={menuRef}>
        <div className="relative">
          {/* User Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-dark transition-colors"
          >
            {/* Avatar */}
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="User avatar"
                className="h-8 w-8 rounded-full ring-2 ring-surface-dark object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 ring-2 ring-surface-dark flex items-center justify-center text-white text-sm font-bold">
                {(userInfo.name?.[0] || userInfo.email?.[0] || "U").toUpperCase()}
              </div>
            )}

            {/* User Info */}
            <div className="flex flex-col flex-1 min-w-0 text-left">
              {userInfo.name ? (
                <>
                  <span className="text-white text-sm font-medium truncate">
                    {userInfo.name}
                  </span>
                  {userInfo.provider && (
                    <span className="text-text-muted text-xs capitalize">
                      via {userInfo.provider}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-white text-sm font-medium truncate">
                  {userInfo.email || "User"}
                </span>
              )}
            </div>

            {/* Chevron */}
            <span className="material-symbols-outlined text-text-muted text-[18px]">
              {showUserMenu ? "expand_less" : "expand_more"}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-dark border border-border-dark rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors group"
              >
                <span className="material-symbols-outlined text-text-muted group-hover:text-red-400 text-[20px]">
                  logout
                </span>
                <span className="text-text-muted group-hover:text-red-400 text-sm font-medium">
                  Sign out
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
