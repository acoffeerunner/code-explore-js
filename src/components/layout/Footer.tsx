"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-border-dark bg-white dark:bg-background-dark py-12">
      <div className="container mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-6 rounded bg-primary text-white">
                <span className="material-symbols-outlined text-[14px]">
                  terminal
                </span>
              </div>
              <h3 className="text-lg font-bold">CodeExplore</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              The intelligent code exploration platform for modern engineering
              teams.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1">
            <h4 className="text-sm font-bold mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-sm font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-sm font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-dark">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} CodeExplore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
