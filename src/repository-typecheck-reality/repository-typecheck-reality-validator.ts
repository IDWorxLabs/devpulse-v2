/**
 * Repository Typecheck Reality — bounded TypeScript diagnostic parsing.
 */

import type { RepositoryTypecheckFinding } from './repository-typecheck-reality-types.js';
import { MAX_TYPECHECK_FINDINGS } from './repository-typecheck-reality-bounds.js';

const TSC_ERROR_PATTERN = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/;

export function parseBoundedTypecheckOutput(output: string, maxFindings = MAX_TYPECHECK_FINDINGS): {
  findings: RepositoryTypecheckFinding[];
  errorCount: number;
  warningCount: number;
} {
  const findings: RepositoryTypecheckFinding[] = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const rawLine of output.split(/\r?\n/)) {
    if (findings.length >= maxFindings) break;
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(TSC_ERROR_PATTERN);
    if (match) {
      errorCount += 1;
      findings.push({
        file: match[1],
        line: Number(match[2]),
        column: Number(match[3]),
        code: match[4],
        message: match[5],
        severity: 'ERROR',
        recommendedAction: `Fix ${match[4]} in ${match[1]}:${match[2]}`,
      });
      continue;
    }

    if (/error TS\d+:/i.test(line)) {
      errorCount += 1;
      if (findings.length < maxFindings) {
        findings.push({
          file: 'unknown',
          line: 0,
          column: 0,
          code: 'TS_UNKNOWN',
          message: line.slice(0, 240),
          severity: 'ERROR',
          recommendedAction: 'Resolve the reported TypeScript compile error.',
        });
      }
      continue;
    }

    if (/warning TS\d+:/i.test(line)) {
      warningCount += 1;
    }
  }

  return { findings, errorCount, warningCount };
}
