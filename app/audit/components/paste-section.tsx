"use client";

import { useState } from "react";
import { parseMemoryItems } from "../lib/audit-engine";

const EXAMPLE_MEMORY = `1. Works as a product designer at a fintech startup in Berlin
2. Prefers dark mode in all applications
3. Has two kids, ages 4 and 7
4. Currently learning Rust programming language
5. Uses VS Code with vim keybindings
6. Prefers dark mode for everything
7. Lives at 42 Schiller Street, Berlin
8. Salary is around 65,000 EUR per year
9. Was working on a side project called TaskFlow in 2023
10. Email is alex.mueller@gmail.com
11. Prefers concise answers
12. Phone number: +49 170 555 1234
13. Diagnosed with ADHD, takes medication
14. Maybe interested in machine learning
15. Uses Figma for design work
16. I think they like cooking Italian food
17. Prefers TypeScript over JavaScript
18. Has a dog named Max`;

const HOWTO = [
  {
    platform: "ChatGPT",
    steps:
      'Profile icon (bottom-left) \u2192 Settings \u2192 Personalization \u2192 Memory \u2192 "Manage" \u2192 Select all text and copy',
  },
  {
    platform: "Claude",
    steps:
      "Profile icon (top-right) \u2192 Settings \u2192 Memory \u2192 Copy the listed memories",
  },
  {
    platform: "Google Gemini",
    steps:
      'Profile icon \u2192 Settings \u2192 "Saved info" or "Memory" \u2192 Copy the content',
  },
];

interface PasteSectionProps {
  onAudit: (text: string) => void;
}

export function PasteSection({ onAudit }: PasteSectionProps) {
  const [text, setText] = useState("");
  const [howToOpen, setHowToOpen] = useState(false);

  const itemCount = parseMemoryItems(text).length;

  function loadExample() {
    setText(EXAMPLE_MEMORY);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">
        Paste your AI memory
      </h2>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">
        Copy your memory from ChatGPT, Claude, or Gemini settings and paste it
        below. Nothing leaves your browser.
      </p>

      {/* How-to toggle */}
      <button
        onClick={() => setHowToOpen(!howToOpen)}
        className="text-sm text-teal-600 font-medium mb-4 flex items-center gap-1 hover:underline cursor-pointer"
      >
        <span className="text-xs">{howToOpen ? "\u25BC" : "\u25B6"}</span>
        Where do I find my memory?
      </button>

      {howToOpen && (
        <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm text-slate-600 leading-relaxed space-y-3">
          {HOWTO.map((h) => (
            <div key={h.platform}>
              <h4 className="font-bold text-slate-800">{h.platform}</h4>
              <p>{h.steps}</p>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Paste your memory here...\n\nExample:\n1. Works as a product designer at a fintech startup\n2. Prefers dark mode in all applications\n3. Has two kids, ages 4 and 7\n4. Currently learning Rust`}
        className="w-full min-h-[240px] border-2 border-slate-200 rounded-lg p-4 text-sm leading-relaxed text-slate-800 resize-y outline-none focus:border-teal-500 transition-colors placeholder:text-slate-400"
      />

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => onAudit(text)}
          disabled={itemCount === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Audit my memory
        </button>
        <button
          onClick={loadExample}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Try an example
        </button>
        <span className="text-xs text-slate-400 ml-auto">
          {itemCount} item{itemCount !== 1 ? "s" : ""} detected
        </span>
      </div>
    </div>
  );
}
