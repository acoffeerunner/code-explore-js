"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

interface HeaderProps {
  showAuth?: boolean;
}

export default function Header({ showAuth = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white">
              <span className="material-symbols-outlined text-[20px]">
                terminal
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              CodeExplore
            </h2>
          </Link>

          {/* Desktop Nav */}
          {showAuth && (
            <div className="hidden md:flex items-center gap-8">
              <div className="flex gap-3">
                <Link href="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Mobile Menu Icon */}
          <button className="md:hidden p-2 text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
