"use client";

import { Modal, Badge } from "@/components/ui";
import type { Repository } from "@/types";

interface RepoInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  repository: Repository;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border-dark last:border-b-0">
      <span className="text-text-muted text-sm">{label}</span>
      <span className="text-white text-sm text-right max-w-[60%] break-all">
        {value}
      </span>
    </div>
  );
}

export default function RepoInfoPanel({
  isOpen,
  onClose,
  repository,
}: RepoInfoPanelProps) {
  const getStatusBadge = () => {
    switch (repository.status) {
      case "ready":
        return <Badge variant="success">Ready</Badge>;
      case "indexing":
        return <Badge variant="warning">Indexing</Badge>;
      case "cloning":
        return <Badge variant="warning">Cloning</Badge>;
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Repository Info" size="md">
      <div className="flex flex-col gap-1">
        <InfoRow
          label="URL"
          value={
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {repository.name || repository.url}
              <span className="material-symbols-outlined text-[14px]">
                open_in_new
              </span>
            </a>
          }
        />
        <InfoRow label="Branch" value={repository.branch} />
        <InfoRow label="Status" value={getStatusBadge()} />

        {repository.status === "indexing" && (
          <InfoRow label="Progress" value={`${repository.progress_pct}%`} />
        )}

        {repository.file_count !== null && (
          <InfoRow
            label="Files Indexed"
            value={repository.file_count.toLocaleString()}
          />
        )}

        {repository.chunk_count !== null && (
          <InfoRow
            label="Code Chunks"
            value={repository.chunk_count.toLocaleString()}
          />
        )}

        <InfoRow label="Created" value={formatDate(repository.created_at)} />
        <InfoRow label="Last Updated" value={formatDate(repository.updated_at)} />
        <InfoRow label="Last Indexed" value={formatDate(repository.indexed_at)} />

        {repository.error_message && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm font-medium mb-1">Error</p>
            <p className="text-red-300 text-sm">{repository.error_message}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
