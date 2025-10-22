"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface HeaderProps {
  showAuth?: boolean;
}

export default function Header({ showAuth = true }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Mobile Menu Button */}
          {showAuth && (
            <button
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {showAuth && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-border-dark py-4">
            <div className="flex flex-col gap-3">
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center">
                  Login
                </Button>
              </Link>
              <Link
                href="/auth?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="primary" className="w-full justify-center">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
