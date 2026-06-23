/**
 * Phase 26.97 — Undefined `.length` access detector.
 */

import type { FounderSimulationPayloadFailureClass } from './founder-simulation-payload-guard-types.js';

export interface UndefinedLengthRisk {
  readOnly: true;
  path: string;
  failureClass: FounderSimulationPayloadFailureClass;
  detail: string;
}

export function detectUndefinedLengthRisks(root: unknown, prefix = ''): UndefinedLengthRisk[] {
  const risks: UndefinedLengthRisk[] = [];

  if (root == null || typeof root !== 'object') {
    return risks;
  }

  const record = root as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value == null) {
      if (/scenarios|blockers|findings|warnings|recommendations|objections|issues|events|notes|actions|gaps|feed|stages|traceEvents|authorities|missing|evidence|categories|capabilities|reasoning/i.test(key)) {
        risks.push({
          readOnly: true,
          path,
          failureClass: classifyMissingField(key),
          detail: `${path} is ${String(value)} — downstream .length may crash`,
        });
      } else if (typeof value === 'undefined' && /markdown|message|prompt|answer|summary/i.test(key)) {
        risks.push({
          readOnly: true,
          path,
          failureClass: 'UNDEFINED_STRING_FIELD',
          detail: `${path} is undefined — downstream string ops may crash`,
        });
      } else if (value === undefined) {
        risks.push({
          readOnly: true,
          path,
          failureClass: 'UNDEFINED_OBJECT_FIELD',
          detail: `${path} is undefined — nested access may crash`,
        });
      }
      continue;
    }

    if (Array.isArray(value)) {
      continue;
    }

    if (typeof value === 'object') {
      risks.push(...detectUndefinedLengthRisks(value, path));
    }
  }

  return risks;
}

function classifyMissingField(key: string): FounderSimulationPayloadFailureClass {
  if (/scenario/i.test(key)) return 'MISSING_SCENARIOS_ARRAY';
  if (/blocker/i.test(key)) return 'MISSING_BLOCKERS_ARRAY';
  if (/finding/i.test(key)) return 'MISSING_FINDINGS_ARRAY';
  if (/recommend/i.test(key)) return 'MISSING_RECOMMENDATIONS_ARRAY';
  if (/warn/i.test(key)) return 'MISSING_WARNINGS_ARRAY';
  return 'UNDEFINED_ARRAY_FIELD';
}

export function hasReportBuilderUnguardedLengthAccess(source: string): boolean {
  const riskyPatterns = [
    /(?<!\?\?)\.(failedScenarios|findings|objections|launchBlockers|whatWorks|whatIsBroken)\.length/,
    /(?<!\?\.)\.(founderProofNotes|requiredFixesBeforeLaunch)\.map/,
    /feed\.events\.map/,
    /traceEvents\.filter/,
  ];
  return riskyPatterns.some((pattern) => pattern.test(source));
}
