/**
 * Founder-readable Validation Budget report.
 */

import type {
  ValidationBudgetState,
  ValidationRecommendation,
  ValidatorScriptScanResult,
} from './types.js';
import { POLICY_OWNER_MODULE } from './types.js';

export interface ValidationBudgetReport {
  ownerModule: string;
  recommendedMode: string;
  requiredCommands: string[];
  forbiddenCommands: string[];
  scanStatus: string;
  riskyScripts: string[];
  recommendation: string;
  summary: string;
}

export function buildValidationBudgetReport(
  recommendation: ValidationRecommendation,
  scan: ValidatorScriptScanResult,
): ValidationBudgetReport {
  const summary = [
    `mode=${recommendation.mode}`,
    `scan=${scan.status}`,
    `nestedCalls=${scan.nestedValidatorCalls.length}`,
    `risky=${scan.riskyScripts.length}`,
  ].join(' | ');

  let textRecommendation = recommendation.reason;
  if (scan.status === 'FAIL') {
    textRecommendation =
      'Remove nested validate:* calls from FAST_FEATURE_CHECK scripts or mark checkpoint scripts as FULL_STACK_CHECK.';
  } else if (scan.status === 'WARN') {
    textRecommendation =
      'Mark legacy nested validators as FULL_STACK_CHECK or migrate to local boundary assertions.';
  }

  return {
    ownerModule: POLICY_OWNER_MODULE,
    recommendedMode: recommendation.mode,
    requiredCommands: recommendation.requiredCommands,
    forbiddenCommands: recommendation.forbiddenCommands,
    scanStatus: scan.status,
    riskyScripts: scan.riskyScripts,
    recommendation: textRecommendation,
    summary,
  };
}

export function formatValidationBudgetReport(
  state: ValidationBudgetState,
): string {
  const recommendation = state.lastRecommendation;
  const scan = state.lastScan;
  if (!recommendation || !scan) {
    return 'No validation budget evaluation yet.';
  }

  const report = buildValidationBudgetReport(recommendation, scan);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Validation Budget Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Policy owner:           ${report.ownerModule}`);
  lines.push(`Recommended mode:       ${report.recommendedMode}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Scan status:            ${report.scanStatus}`);
  lines.push(`Scanned validator files: ${scan.scannedFiles}`);
  lines.push(`Nested calls found:     ${scan.nestedValidatorCalls.length}`);
  lines.push('');

  lines.push('Required commands:');
  for (const cmd of report.requiredCommands) {
    lines.push(`  • ${cmd}`);
  }
  lines.push('');

  if (report.forbiddenCommands.length > 0) {
    lines.push('Forbidden patterns:');
    for (const cmd of report.forbiddenCommands) {
      lines.push(`  • ${cmd}`);
    }
    lines.push('');
  }

  if (report.riskyScripts.length > 0) {
    lines.push(`Risky scripts (${report.riskyScripts.length}):`);
    for (const script of report.riskyScripts) {
      lines.push(`  • ${script}`);
    }
    lines.push('');
  }

  if (scan.nestedValidatorCalls.length > 0) {
    lines.push('Nested validator detections:');
    for (const call of scan.nestedValidatorCalls.slice(0, 10)) {
      lines.push(
        `  • ${call.file}:${call.line} [${call.scriptMode}] ${call.pattern}`,
      );
    }
    if (scan.nestedValidatorCalls.length > 10) {
      lines.push(`  ... and ${scan.nestedValidatorCalls.length - 10} more`);
    }
    lines.push('');
  }

  if (state.warnings.length > 0) {
    lines.push(`Warnings (${state.warnings.length}):`);
    for (const w of state.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
