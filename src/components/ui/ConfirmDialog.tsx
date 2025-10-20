"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading: externalLoading,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isDestructive = variant === "destructive";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "primary" : "primary"}
            onClick={handleConfirm}
            isLoading={isLoading}
            className={
              isDestructive
                ? "!bg-red-600 hover:!bg-red-700 !shadow-red-600/25"
                : ""
            }
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        {isDestructive && (
          <div className="shrink-0 h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-[20px]">
              warning
            </span>
          </div>
        )}
        <p className="text-text-muted text-sm leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
