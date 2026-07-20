/**
 * Universal CRUD Generation Engine V1 — generation report helpers.
 */

import type { UniversalCrudGenerationReport } from './universal-crud-types.js';
import { diagnoseUniversalCrudGenerationGaps } from './crud-behavior-verification.js';

export function renderUniversalCrudGenerationReportMarkdown(report: UniversalCrudGenerationReport): string {
  const lines: string[] = [];
  lines.push('# Universal CRUD Generation Report');
  lines.push('');
  lines.push(`Engine version: ${report.engineVersion}`);
  lines.push(`Entities: ${report.entityCount}`);
  lines.push(`All behavior verifications passed: ${report.allPassed}`);
  lines.push('');
  lines.push('## Shared runtime');
  for (const file of report.sharedRuntimeFiles) {
    lines.push(`- ${file}`);
  }
  lines.push('');
  lines.push('## Entities');
  for (const entity of report.entities) {
    lines.push(`- ${entity.entityId} (${entity.displayName}) — provider: ${entity.persistenceProvider}`);
  }
  lines.push('');
  lines.push('## Behavior verification');
  for (const v of report.behaviorVerifications) {
    lines.push(`- ${v.entityId}: ${v.passed ? 'PASS' : 'FAIL'}`);
    if (!v.passed) {
      const gaps = diagnoseUniversalCrudGenerationGaps(v);
      lines.push(`  - gaps: ${gaps.join(', ')}`);
    }
  }
  return lines.join('\n');
}
