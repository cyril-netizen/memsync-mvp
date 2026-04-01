"use client";

import { cn } from "@/lib/utils";
import type { AuditResult, Label } from "../lib/audit-engine";

const LABEL_CONFIG: Record<
  Label,
  { name: string; bg: string; text: string; border: string; dot: string }
> = {
  keep: {
    name: "Keep",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-l-green-500",
    dot: "bg-green-500",
  },
  rewrite: {
    name: "Rewrite",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  delete: {
    name: "Delete",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-l-red-500",
    dot: "bg-red-500",
  },
  review: {
    name: "Review",
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
  },
};

interface AuditSectionProps {
  audit: AuditResult;
  overrides: Record<number, Label>;
  onOverride: (id: number, label: Label) => void;
  onGenerateProfile: () => void;
  onBack: () => void;
}

export function AuditSection({
  audit,
  overrides,
  onOverride,
  onGenerateProfile,
  onBack,
}: AuditSectionProps) {
  const { items, stats } = audit;

  // Recompute stats with overrides
  const effectiveStats = { keep: 0, rewrite: 0, delete: 0, review: 0, total: stats.total };
  items.forEach((item) => {
    const effective = overrides[item.id] || item.label;
    effectiveStats[effective]++;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Audit results</h2>
      <p className="text-sm text-slate-500 mb-5">
        {stats.total} items analyzed. {effectiveStats.keep} to keep,{" "}
        {effectiveStats.rewrite} to rewrite, {effectiveStats.delete} to delete,{" "}
        {effectiveStats.review} to review.
      </p>

      {/* Stats bar */}
      <div className="flex gap-2 flex-wrap mb-6">
        {effectiveStats.keep > 0 && (
          <StatBadge label="keep" count={effectiveStats.keep} />
        )}
        {effectiveStats.rewrite > 0 && (
          <StatBadge label="rewrite" count={effectiveStats.rewrite} />
        )}
        {effectiveStats.delete > 0 && (
          <StatBadge label="delete" count={effectiveStats.delete} />
        )}
        {effectiveStats.review > 0 && (
          <StatBadge label="review" count={effectiveStats.review} />
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const effective = overrides[item.id] || item.label;
          const config = LABEL_CONFIG[effective];
          const isOverridden = overrides[item.id] && overrides[item.id] !== item.label;

          return (
            <div
              key={item.id}
              className={cn(
                "border border-slate-200 rounded-lg p-4 border-l-4 transition-all",
                config.border,
                isOverridden && "opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={cn(
                    "text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    config.bg,
                    config.text
                  )}
                >
                  {config.name}
                </span>
                <span className="text-xs text-slate-400">#{item.id + 1}</span>
                {item.sensitive.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[0.65rem] font-semibold bg-red-100 text-red-800 px-1.5 py-0.5 rounded"
                  >
                    &#9888; {s}
                  </span>
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-slate-700 leading-relaxed mb-1">
                {item.original}
              </p>

              {/* Reason */}
              <p className="text-xs text-slate-500 italic mb-2">
                {item.reasons.join(". ")}
              </p>

              {/* Suggestion */}
              {item.suggestion && (
                <div className="text-xs bg-teal-50 text-teal-700 px-3 py-2 rounded-md mb-2">
                  Suggestion: {item.suggestion}
                </div>
              )}

              {/* Override buttons */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onOverride(item.id, "keep")}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded border font-medium transition-colors cursor-pointer",
                    effective === "keep"
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Keep
                </button>
                <button
                  onClick={() => onOverride(item.id, "delete")}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded border font-medium transition-colors cursor-pointer",
                    effective === "delete"
                      ? "bg-red-100 border-red-500 text-red-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={onGenerateProfile}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          Generate clean profile
        </button>
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function StatBadge({ label, count }: { label: Label; count: number }) {
  const config = LABEL_CONFIG[label];
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
        config.bg,
        config.text
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", config.dot)} />
      {count} {config.name.toLowerCase()}
    </div>
  );
}
