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
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 md:px-8 py-6 md:py-10 h-full pt-16 md:pt-6">
      {/* Page Header */}
      <header className="mb-6 md:mb-8 flex-shrink-0">
        <div className="flex flex-col gap-1 md:gap-2">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Select a Branch
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-base md:text-lg">
            Choose a branch from{" "}
            <span className="text-primary font-medium break-all">{repoName}</span> to
            analyze.
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="mb-4 md:mb-6 flex-shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
          </div>
          <input
            className="block w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 rounded-xl bg-white dark:bg-surface-dark border-0 ring-1 ring-slate-200 dark:ring-white/10 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary transition-all text-sm md:text-base shadow-sm"
            placeholder="Find a branch..."
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Branch List Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/5 shadow-xl">
        {/* List Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-10">Branch Name</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBranches.map((branch, index) => (
            <div
              key={branch.name}
              onClick={() => onSelect(branch.name)}
              className={`group flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-surface-hover transition-colors cursor-pointer ${
                index === filteredBranches.length - 1 ? "border-b-0" : ""
              } ${selectedBranch === branch.name ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`p-1.5 md:p-2 rounded-lg transition-colors shrink-0 ${
                    selectedBranch === branch.name
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 dark:bg-white/5 text-gray-400 group-hover:bg-primary group-hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">
                    rebase
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <p className="text-sm md:text-base font-medium text-slate-900 dark:text-white truncate">
                    {branch.name}
                  </p>
                  {branch.is_default && (
                    <Badge variant="primary" size="sm" className="shrink-0">
                      Default
                    </Badge>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <label className="relative inline-flex items-center cursor-pointer p-2 -m-2">
                  <input
                    type="radio"
                    name="branch_select"
                    className="sr-only peer"
                    checked={selectedBranch === branch.name}
                    onChange={() => onSelect(branch.name)}
                  />
                  <div className="w-5 h-5 md:w-5 md:h-5 border-2 border-gray-500 rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
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
            <div className="p-6 md:p-8 text-center text-gray-500 text-sm md:text-base">
              No branches found matching &quot;{filter}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex-shrink-0 mt-4 md:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
        <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!selectedBranch}
          isLoading={isLoading}
          className="w-full sm:w-auto"
          icon={
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          }
          iconPosition="right"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
