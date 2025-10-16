"use client";

import { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "primary";
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-bold uppercase tracking-wider rounded-full border";

  const variantStyles = {
    default: "bg-white/10 text-text-subtle border-white/10",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    primary: "bg-primary/20 text-primary border-primary/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
