/**
 * MemSync Audit Engine
 * Rule-based memory analysis â runs 100% in-browser, no data leaves the client.
 */

// ---- Types ----

export type Label = "keep" | "rewrite" | "delete" | "review";

export interface AuditItem {
  id: number;
  original: string;
  label: Label;
  reasons: string[];
  suggestion: string | null;
  sensitive: string[];
}

export interface AuditStats {
  total: number;
  keep: number;
  rewrite: number;
  delete: number;
  review: number;
}

export interface AuditResult {
  items: AuditItem[];
  stats: AuditStats;
}

interface ParsedItem {
  index: number;
  text: string;
}

interface SensitivePattern {
  pattern: RegExp;
  type: string;
  label: string;
}

// ---- Sensitive data patterns ----

const SENSITIVE_PATTERNS: SensitivePattern[] = [
  { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/, type: "ssn", label: "Social Security Number" },
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, type: "credit_card", label: "Credit card number" },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, type: "email", label: "Email address" },
  { pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/, type: "phone", label: "Phone number" },
  {
    pattern: /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl)\b/i,
    type: "address",
    label: "Physical address",
  },
  { pattern: /\b(?:password|passwd|pwd)\s*(?:is|was|:)\s*\S+/i, type: "password", label: "Password or credential" },
  {
    pattern: /\b(?:api[_\s-]?key|secret[_\s-]?key|access[_\s-]?token|bearer)\s*(?:is|was|:)?\s*[A-Za-z0-9_\-]{16,}/i,
    type: "api_key",
    label: "API key or token",
  },
  { pattern: /\b(?:diagnosed|diagnosis|medication|prescription|therapy|treatment|symptoms?)\b/i, type: "medical", label: "Medical information" },
  {
    pattern: /\b(?:salary|income|bank\s*account|routing\s*number|net\s*worth|debt|mortgage)\b/i,
    type: "financial",
    label: "Financial information",
  },
  {
    pattern: /\b(?:passport|driver'?s?\s*licen[cs]e|national\s*id|birth\s*certificate)\s*(?:number|#|no\.?)?\s*:?\s*\w+/i,
    type: "id_document",
    label: "Identity document",
  },
];

// ---- Date detection ----

const DATE_PATTERNS: RegExp[] = [
  /\b(?:as\s+of|since|in|from|until|before|after|during)\s+(?:(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+)?\d{4}\b/i,
  /\b20(?:1\d|2[0-6])\b/,
  /\b(?:last\s+(?:year|month|week)|recently|currently|at\s+the\s+moment|right\s+now)\b/i,
  /\b(?:depuis|en|a\s+partir\s+de|jusqu'en|avant|apres)\s+(?:(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+)?\d{4}\b/i,
];

// ---- Vagueness patterns ----

const VAGUE_PATTERNS: RegExp[] = [
  /\b(?:sometimes|maybe|might|probably|i\s+think|not\s+sure|possibly|apparently)\b/i,
  /\b(?:quelque\s+chose|peut-etre|probablement|je\s+crois|il\s+semble)\b/i,
];

// ---- Preference patterns ----

const PREFERENCE_PATTERNS: RegExp[] = [
  /\b(?:prefers?|likes?|wants?|uses?|works?\s+with|favorite)\b/i,
  /\b(?:prefere|aime|utilise|travaille\s+avec|favori)\b/i,
];

// ---- Stop words ----

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for",
  "of", "and", "or", "all", "with", "they", "their", "them", "i", "my", "me",
  "has", "have", "had", "that", "this", "it", "its", "be", "been", "do", "does",
  "did", "not", "no", "but", "from", "by", "as", "if", "so", "than", "very",
  "just", "also", "about",
]);

// ---- Utility functions ----

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeForComparison(a).split(" "));
  const wordsB = new Set(normalizeForComparison(b).split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function extractYear(text: string): number | null {
  const match = text.match(/\b(20(?:1\d|2[0-6]))\b/);
  return match ? parseInt(match[1]) : null;
}

function isStaleYear(year: number | null): boolean {
  const currentYear = new Date().getFullYear();
  return year !== null && year < currentYear - 1;
}

function isLowValue(text: string): boolean {
  const words = text.trim().split(/\s+/);
  return words.length <= 3;
}

function extractTopicWords(text: string): string[] {
  return normalizeForComparison(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ---- Parse raw memory text into individual items ----

export function parseMemoryItems(rawText: string): ParsedItem[] {
  const text = rawText.trim();
  if (!text) return [];

  let lines: string[];

  const numberedPattern = /^\s*\d+[.)]\s+/m;
  if (numberedPattern.test(text)) {
    lines = text.split(/\n\s*\d+[.)]\s+/).filter((l) => l.trim());
  } else if (/^\s*[-*+]\s+/m.test(text)) {
    lines = text.split(/\n\s*[-*+]\s+/).filter((l) => l.trim());
  } else if (text.includes("\n")) {
    lines = text.split(/\n+/).filter((l) => l.trim());
  } else if (text.length > 200) {
    lines = text.split(/(?<=\.)\s+/).filter((l) => l.trim());
  } else {
    lines = [text];
  }

  return lines
    .map((line, idx) => ({
      index: idx,
      text: line.replace(/^\s*[-*+]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim(),
    }))
    .filter((item) => item.text.length > 0);
}

// ---- Main audit function ----

export function auditMemory(rawText: string): AuditResult {
  const items = parseMemoryItems(rawText);

  if (items.length === 0) {
    return { items: [], stats: { total: 0, keep: 0, rewrite: 0, delete: 0, review: 0 } };
  }

  const results: AuditItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const text = items[i].text;
    const result: AuditItem = {
      id: i,
      original: text,
      label: "keep",
      reasons: [],
      suggestion: null,
      sensitive: [],
    };

    // 1. Sensitive data
    for (const sp of SENSITIVE_PATTERNS) {
      if (sp.pattern.test(text)) {
        result.sensitive.push(sp.label);
      }
    }
    if (result.sensitive.length > 0) {
      result.label = "delete";
      result.reasons.push(`Contains sensitive data: ${result.sensitive.join(", ")}`);
    }

    // 2. Staleness (old dates)
    const year = extractYear(text);
    if (isStaleYear(year)) {
      if (result.label !== "delete") result.label = "rewrite";
      result.reasons.push(`References year ${year} -- may be outdated`);
      result.suggestion = text.replace(
        /\b20(?:1\d|2[0-5])\b/,
        `[update to ${new Date().getFullYear()}?]`
      );
    }

    // 3. Temporal language
    const hasTemporalLanguage =
      /\b(?:currently|right now|at the moment|these days|actuellement|en ce moment)\b/i.test(text);
    if (hasTemporalLanguage && result.label === "keep") {
      result.label = "review";
      result.reasons.push('Uses temporal language ("currently", "right now") -- verify this is still true');
    }

    // 4. Duplicates
    for (let j = 0; j < i; j++) {
      const similarity = computeSimilarity(text, items[j].text);
      if (similarity > 0.65) {
        result.label = "delete";
        result.reasons.push(`Near-duplicate of item #${j + 1}`);
        break;
      } else if (similarity > 0.4 && result.label === "keep") {
        result.label = "review";
        result.reasons.push(`Similar to item #${j + 1} -- possible duplicate`);
      }

      if (result.label !== "delete") {
        const bothPrefs =
          PREFERENCE_PATTERNS.some((p) => p.test(text)) &&
          PREFERENCE_PATTERNS.some((p) => p.test(items[j].text));
        if (bothPrefs) {
          const topicWordsA = extractTopicWords(text);
          const topicWordsB = extractTopicWords(items[j].text);
          const overlap = topicWordsA.filter((w) => topicWordsB.includes(w));
          if (overlap.length >= 2) {
            result.label = "delete";
            result.reasons.push(`Overlapping preference with item #${j + 1} (${overlap.join(", ")})`);
            break;
          }
        }
      }
    }

    // 5. Vagueness
    for (const vp of VAGUE_PATTERNS) {
      if (vp.test(text)) {
        if (result.label === "keep") result.label = "rewrite";
        result.reasons.push("Contains vague language -- could be made more specific");
        break;
      }
    }

    // 6. Low value
    if (isLowValue(text)) {
      if (result.label === "keep") result.label = "review";
      result.reasons.push("Very short -- may lack useful context");
    }

    // 7. Default reason
    if (result.reasons.length === 0) {
      result.reasons.push("Looks current and relevant");
    }

    results.push(result);
  }

  const stats: AuditStats = {
    total: results.length,
    keep: results.filter((r) => r.label === "keep").length,
    rewrite: results.filter((r) => r.label === "rewrite").length,
    delete: results.filter((r) => r.label === "delete").length,
    review: results.filter((r) => r.label === "review").length,
  };

  return { items: results, stats };
}

// ---- Generate per-platform checklist ----

export interface PlatformChecklists {
  chatgpt: string[];
  claude: string[];
  gemini: string[];
}

export function generateChecklist(stats: AuditStats): PlatformChecklists {
  const hasDeletes = stats.delete > 0;
  const hasRewrites = stats.rewrite > 0;

  const chatgpt = [
    "Open ChatGPT (chat.openai.com)",
    "Click your profile icon (bottom-left) > Settings",
    'Go to "Personalization" > "Memory"',
    hasDeletes ? `Delete the ${stats.delete} item(s) marked for removal` : null,
    hasRewrites
      ? "For items to rewrite: delete the old version, then mention the updated fact in a new conversation so ChatGPT re-learns it"
      : null,
    'Alternatively: paste your clean profile in a new chat and say "Update your memory with this profile"',
  ].filter(Boolean) as string[];

  const claude = [
    "Open Claude (claude.ai)",
    "Click your profile icon (top-right) > Settings",
    'Go to "Memory" or check the memory panel',
    hasDeletes ? `Remove the ${stats.delete} item(s) marked for deletion` : null,
    hasRewrites
      ? "For items to rewrite: delete and re-state the corrected information in a new conversation"
      : null,
    "Note: Claude memory management may vary by plan and region",
  ].filter(Boolean) as string[];

  const gemini = [
    "Open Google Gemini (gemini.google.com)",
    "Click your profile icon > Settings",
    'Look for "Memory" or "Saved info" section',
    hasDeletes ? `Remove the ${stats.delete} item(s) marked for deletion` : null,
    hasRewrites
      ? "Update outdated items directly if the interface allows editing"
      : null,
    "Note: Gemini memory features may still be rolling out in some regions",
  ].filter(Boolean) as string[];

  return { chatgpt, claude, gemini };
}
