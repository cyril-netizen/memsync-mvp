import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MemSync Audit — Clean your AI memory",
  description:
    "Free, privacy-first audit tool for your ChatGPT, Claude & Gemini memory. Detect duplicates, stale data, and sensitive information — 100% in your browser.",
  openGraph: {
    title: "MemSync Audit — Clean your AI memory",
    description:
      "Free, privacy-first audit for ChatGPT, Claude & Gemini memory. Nothing leaves your browser.",
    type: "website",
  },
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
