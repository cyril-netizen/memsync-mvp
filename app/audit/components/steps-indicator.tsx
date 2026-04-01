"use client";

import { cn } from "@/lib/utils";

type Step = "paste" | "audit" | "profile";

const STEPS: { key: Step; label: string }[] = [
  { key: "paste", label: "Paste" },
  { key: "audit", label: "Audit" },
  { key: "profile", label: "Clean profile" },
];

export function StepsIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-slate-300 text-sm select-none">&rarr;</span>
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold transition-colors",
              i < currentIdx && "text-green-500",
              i === currentIdx && "text-teal-600",
              i > currentIdx && "text-slate-400"
            )}
          >
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                i < currentIdx && "bg-green-500 text-white",
                i === currentIdx && "bg-teal-500 text-white",
                i > currentIdx && "bg-slate-200 text-slate-500"
              )}
            >
              {i < currentIdx ? "\u2713" : i + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
