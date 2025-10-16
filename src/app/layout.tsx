import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeExplore - AI Code Understanding",
  description:
    "CodeExplore uses advanced RAG technology to help developers navigate, debug, and document complex repositories instantly.",
  keywords: ["code", "AI", "RAG", "repository", "analysis", "documentation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${notoSans.variable} font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
