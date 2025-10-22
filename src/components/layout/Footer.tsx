"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-border-dark bg-white dark:bg-background-dark py-12">
      <div className="container mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex flex-col items-center text-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center size-6 rounded bg-primary text-white">
              <span className="material-symbols-outlined text-[14px]">
                terminal
              </span>
            </div>
            <h3 className="text-lg font-bold">CodeExplore</h3>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed max-w-md">
            The intelligent code exploration platform for modern engineering
            teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
