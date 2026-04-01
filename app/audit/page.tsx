"use client";

import { useState } from "react";
import type { AuditResult, Label } from "./lib/audit-engine";
import { auditMemory } from "./lib/audit-engine";
import { StepsIndicator } from "./components/steps-indicator";
import { PasteSection } from "./components/paste-section";
import { AuditSection } from "./components/audit-section";
import { ProfileSection } from "./components/profile-section";

type Step = "paste" | "audit" | "profile";

export default function AuditPage() {
  const [step, setStep] = useState<Step>("paste");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [overrides, setOverrides] = useState<Record<number, Label>>({});

  function handleAudit(text: string) {
    const result = auditMemory(text);
    setAudit(result);
    setOverrides({});
    setStep("audit");
  }

  function handleOverride(id: number, label: Label) {
    setOverrides((prev) => ({ ...prev, [id]: label }));
  }

  function handleGenerateProfile() {
    setStep("profile");
  }

  function handleBack() {
    setStep("paste");
    setAudit(null);
    setOverrides({});
  }

  function handleStartOver() {
    setStep("paste");
    setAudit(null);
    setOverrides({});
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              MemSync
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              Audit
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            100% in-browser
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <StepsIndicator current={step} />

        {step === "paste" && <PasteSection onAudit={handleAudit} />}

        {step === "audit" && audit && (
          <AuditSection
            audit={audit}
            overrides={overrides}
            onOverride={handleOverride}
            onGenerateProfile={handleGenerateProfile}
            onBack={handleBack}
          />
        )}

        {step === "profile" && audit && (
          <ProfileSection
            audit={audit}
            overrides={overrides}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-xs text-slate-400 space-y-1">
          <p>
            MemSync by{" "}
            <a
              href="https://nanocorp.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline"
            >
              NanoCorp
            </a>
          </p>
          <p>
            Your data never leaves your browser. No tracking. No cookies.
          </p>
        </div>
      </footer>
    </div>
  );
}
app/audit/page.tsx
