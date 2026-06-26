/**
 * Prompt Faithfulness Engine V2 — prompt parser.
 */

import { createHash } from 'node:crypto';
import type { ParsedPrompt, ParsedPromptSection } from './prompt-faithfulness-v2-types.js';

function hashPrompt(rawPrompt: string): string {
  return createHash('sha256').update(rawPrompt).digest('hex').slice(0, 16);
}

function splitSentences(rawPrompt: string): string[] {
  return rawPrompt
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function parseSections(rawPrompt: string): ParsedPromptSection[] {
  const lines = rawPrompt.split('\n');
  const sections: ParsedPromptSection[] = [];
  let current: ParsedPromptSection | null = null;
  let sectionCounter = 0;

  const flush = (): void => {
    if (current) sections.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3}\s+.+|[A-Z][^:\n]{2,60}:)\s*$/);
    if (headingMatch) {
      flush();
      sectionCounter += 1;
      current = {
        readOnly: true,
        sectionId: `section-${sectionCounter}`,
        heading: headingMatch[1].replace(/^#+\s*/, '').replace(/:$/, ''),
        lines: [],
        startLine: i + 1,
        endLine: i + 1,
      };
      continue;
    }

    if (!current) {
      sectionCounter += 1;
      current = {
        readOnly: true,
        sectionId: `section-${sectionCounter}`,
        heading: null,
        lines: [],
        startLine: i + 1,
        endLine: i + 1,
      };
    }

    if (line.trim()) {
      current = {
        ...current,
        lines: [...current.lines, line],
        endLine: i + 1,
      };
    }
  }

  flush();
  return sections;
}

export function parsePrompt(rawPrompt: string): ParsedPrompt {
  const trimmed = rawPrompt.trim();
  return {
    readOnly: true,
    rawPrompt: trimmed,
    promptHash: hashPrompt(trimmed),
    lineCount: trimmed.split('\n').length,
    sections: parseSections(trimmed),
    sentences: splitSentences(trimmed),
  };
}
