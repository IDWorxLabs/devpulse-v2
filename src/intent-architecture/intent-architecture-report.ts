/**
 * Intent Architecture founder-readable report — understanding layer only.
 */

import type { IntentArchitectureReport, IntentArchitectureState, IntentRecord, IntentType } from './types.js';
import { INTENT_OWNER_MODULE } from './types.js';

function countByType(intents: IntentRecord[]): Partial<Record<IntentType, number>> {
  const counts: Partial<Record<IntentType, number>> = {};
  for (const intent of intents) {
    counts[intent.intentType] = (counts[intent.intentType] ?? 0) + 1;
  }
  return counts;
}

function buildConfidenceSummary(intents: IntentRecord[]): string {
  if (intents.length === 0) return 'No intents recorded.';
  const high = intents.filter((i) => i.confidence === 'HIGH').length;
  const medium = intents.filter((i) => i.confidence === 'MEDIUM').length;
  const low = intents.filter((i) => i.confidence === 'LOW').length;
  return `HIGH=${high} MEDIUM=${medium} LOW=${low}`;
}

export function buildIntentArchitectureReport(
  state: IntentArchitectureState,
  intents: IntentRecord[],
): IntentArchitectureReport {
  const latestIntent = intents.length > 0 ? intents[intents.length - 1] : null;
  let recommendation =
    'Intent Architecture transforms user requests into structured intent — Chat Authority still owns answers.';
  if (state.intentCount === 0) {
    recommendation =
      'Extract intent from user input before downstream planning — no execution or code generation here.';
  } else if (intents.some((i) => i.intentType === 'UNKNOWN')) {
    recommendation =
      'Some intents are ambiguous — clarify with user via Chat Authority before AiDev or execution systems act.';
  }

  return {
    ownerModule: INTENT_OWNER_MODULE,
    totalIntents: state.intentCount,
    intentTypeCounts: countByType(intents),
    latestIntent: latestIntent ? { ...latestIntent } : null,
    confidenceSummary: buildConfidenceSummary(intents),
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatIntentArchitectureReport(
  state: IntentArchitectureState,
  intents: IntentRecord[],
): string {
  const report = buildIntentArchitectureReport(state, intents);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Intent Architecture Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Architecture ID: ${state.architectureId}`,
    `Total intents: ${report.totalIntents}`,
    `Confidence summary: ${report.confidenceSummary}`,
    '',
  ];

  const typeEntries = Object.entries(report.intentTypeCounts);
  if (typeEntries.length > 0) {
    lines.push('Intent type counts:');
    for (const [type, count] of typeEntries) {
      lines.push(`  • ${type}: ${count}`);
    }
    lines.push('');
  }

  if (report.latestIntent) {
    lines.push(`Latest intent: ${report.latestIntent.intentType} (${report.latestIntent.confidence})`);
    lines.push(`  "${report.latestIntent.normalizedInput}"`);
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
