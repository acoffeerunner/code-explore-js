"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import type { Branch } from "@/types";

interface BranchListProps {
  branches: Branch[];
  selectedBranch: string | null;
  onSelect: (branch: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  repoName?: string;
}

export default function BranchList({
  branches,
  selectedBranch,
  onSelect,
  onConfirm,
  onCancel,
  isLoading = false,
  repoName = "Repository",
}: BranchListProps) {
  const [filter, setFilter] = useState("");

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-8 py-10 h-full">
      {/* Page Header */}
      <header className="mb-8 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Select a Branch
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-lg">
            Choose a branch from{" "}
            <span className="text-primary font-medium">{repoName}</span> to
            analyze.
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="mb-6 flex-shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
          </div>
          <input
            className="block w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-surface-dark border-0 ring-1 ring-slate-200 dark:ring-white/10 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary transition-all text-base shadow-sm"
            placeholder="Find a branch (e.g., main, feature/xyz)..."
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Branch List Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/5 shadow-xl">
        {/* List Header - Fixed alignment: col-span-10 + col-span-2 = 12 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-10">Branch Name</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBranches.map((branch, index) => (
            <div
              key={branch.name}
              onClick={() => onSelect(branch.name)}
              className={`group grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-surface-hover transition-colors cursor-pointer ${
                index === filteredBranches.length - 1 ? "border-b-0" : ""
              }`}
            >
              <div className="col-span-10 flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    selectedBranch === branch.name
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 dark:bg-white/5 text-gray-400 group-hover:bg-primary group-hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    rebase
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium text-slate-900 dark:text-white">
                    {branch.name}
                  </p>
                  {branch.is_default && (
                    <Badge variant="primary" size="sm">
                      Default
                    </Badge>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex justify-end">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="branch_select"
                    className="sr-only peer"
                    checked={selectedBranch === branch.name}
                    onChange={() => onSelect(branch.name)}
                  />
                  <div className="w-5 h-5 border-2 border-gray-500 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                    <div
                      className={`w-2 h-2 bg-white rounded-full transition-opacity ${
                        selectedBranch === branch.name
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          ))}

          {filteredBranches.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No branches found matching &quot;{filter}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex-shrink-0 mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!selectedBranch}
          isLoading={isLoading}
          icon={
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          }
          iconPosition="right"
        >
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
