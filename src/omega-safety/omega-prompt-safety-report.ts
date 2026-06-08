/**
 * Founder-readable OMEGA Prompt Safety report.
 */

import type { OmegaPromptSafetyResult } from './types.js';
import { OMEGA_OWNER_MODULE } from './types.js';

export function formatOmegaPromptSafetyReport(result: OmegaPromptSafetyResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — OMEGA Prompt Safety Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Policy owner:           ${OMEGA_OWNER_MODULE}`);
  lines.push(`Result ID:              ${result.resultId}`);
  lines.push(`Status:                 ${result.status}`);
  lines.push(`Scope:                  ${result.scope}`);
  lines.push(`System ID:              ${result.systemId}`);
  lines.push(`Authority owner:        ${result.authorityOwner}`);
  lines.push(`Validation mode:        ${result.validationMode}`);
  lines.push('');

  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const w of result.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const e of result.errors) {
      lines.push(`  • ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${result.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
