/**
 * REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1 — read-only production capability audit.
 *
 * Run only:
 *   npx tsx scripts/audit-real-production-generation-capability-v1.ts
 *
 * Does NOT modify generators, authorities, or validators.
 * Does NOT run sibling validators or VERE.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runRealProductionGenerationCapabilityAudit,
  renderAuditReportMarkdown,
  REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN,
} from '../src/real-production-generation-capability-audit-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.aidev-audit-reports');

function main(): void {
  console.log('\n# Real Production Generation Capability Audit V1\n');
  console.log('Running read-only audit (CBGA → envelope → materialization) for 8 prompts...\n');

  const report = runRealProductionGenerationCapabilityAudit(ROOT);
  const markdown = renderAuditReportMarkdown(report);

  mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = join(REPORT_DIR, 'real-production-generation-capability-audit-v1.md');
  writeFileSync(reportPath, markdown, 'utf8');

  console.log(report.executiveSummary);
  console.log('');
  console.log(report.closenessAssessment);
  console.log('');

  console.log('## Prompt Results');
  for (const pr of report.promptResults) {
    const moduleRows = pr.matrixRows.filter((r) => r.featureKind === 'MODULE');
    const fully = moduleRows.filter((r) => r.status === 'FULLY_MATERIALIZED').length;
    const nonfunctional = moduleRows.filter((r) => r.status === 'REACHABLE_BUT_NONFUNCTIONAL').length;
    console.log(
      `- ${pr.scenario.label}: envelope=${pr.envelopeValid ? 'valid' : 'INVALID'}; modules ${pr.materializedModuleCount}/${pr.approvedModuleCount} files; FULLY=${fully}; NONFUNCTIONAL=${nonfunctional}; blocked=${pr.blockedModuleCount}`,
    );
  }

  console.log('');
  console.log(`## Matrix: ${report.materializationMatrix.length} rows total`);
  console.log(`## Static shells: ${report.staticShellInventory.length} findings`);
  console.log(`## Silent skips: ${report.silentSkipInventory.length} documented patterns`);
  console.log(`## Ranked root causes: ${report.rankedSystemicFindings.length}`);
  console.log('');
  console.log(`Full report: ${reportPath}`);
  console.log('');
  console.log(REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN);
}

main();
