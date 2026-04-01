"use client";

import { useState } from "react";
import type { AuditResult, AuditStats, Label } from "../lib/audit-engine";
import { generateChecklist } from "../lib/audit-engine";

const PLATFORMS = [
  { key: "chatgpt" as const, label: "ChatGPT" },
  { key: "claude" as const, label: "Claude" },
  { key: "gemini" as const, label: "Gemini" },
];

interface ProfileSectionProps {
  audit: AuditResult;
  overrides: Record<number, Label>;
  onStartOver: () => void;
}

export function ProfileSection({
  audit,
  overrides,
  onStartOver,
}: ProfileSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"chatgpt" | "claude" | "gemini">("chatgpt");

  // Build clean profile text
  const keptItems = audit.items.filter((item) => {
    const effective = overrides[item.id] || item.label;
    return effective !== "delete";
  });

  const profileText = keptItems
    .map((item, i) => {
      const effective = overrides[item.id] || item.label;
      if (item.suggestion && effective === "rewrite") {
        return `${i + 1}. ${item.suggestion}`;
      }
      return `${i + 1}. ${item.original}`;
    })
    .join("\n");

  // Compute effective stats for checklist
  const effectiveStats: AuditStats = { total: audit.stats.total, keep: 0, rewrite: 0, delete: 0, review: 0 };
  audit.items.forEach((item) => {
    const effective = overrides[item.id] || item.label;
    effectiveStats[effective]++;
  });

  const checklists = generateChecklist(effectiveStats);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = profileText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Clean profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Your clean profile
        </h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          This is your audited memory, ready to paste back into your AI tools.
          You can edit it below before copying.
        </p>

        <textarea
          defaultValue={profileText}
          className="w-full min-h-[160px] border-2 border-teal-200 bg-teal-50 rounded-lg p-4 text-sm leading-relaxed text-slate-800 resize-y outline-none focus:border-teal-500 transition-colors"
        />

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            Copy to clipboard
          </button>
          <span
            className={`text-sm text-green-500 font-semibold transition-opacity ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            Copied!
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          How to apply your changes
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Step-by-step checklist for each platform.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActiveTab(p.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                activeTab === p.key
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {checklists[activeTab].map((step, i) => (
            <div key={i} className="flex gap-3 py-2 text-sm text-slate-700 items-start">
              <span className="min-w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 rounded-2xl shadow-sm p-6 sm:p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Want a deeper audit?
        </h2>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed max-w-md mx-auto">
          The free tier uses rule-based analysis. Founding Members get access to
          AI-powered audits with smarter suggestions when the Pro tier launches.
        </p>
        <a
          href="https://buy.stripe.com/6oUaEY5Pm16v9uO64zeNi1s"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-700 transition-colors"
        >
          Become a Founding Member -- $19
        </a>
      </div>

      {/* Restart */}
      <div className="flex justify-center">
        <button
          onClick={onStartOver}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Start a new audit
        </button>
      </div>
    </div>
  );
}
