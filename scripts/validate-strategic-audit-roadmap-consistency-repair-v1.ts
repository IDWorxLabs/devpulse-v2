/**
 * Strategic Audit Roadmap Consistency Repair V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStrategicAuditRoadmapConsistencyRepairV1ReportMarkdown,
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_ARTIFACT_DIR,
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN,
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_REPORT_TITLE,
  runStrategicAuditRoadmapConsistencyRepairV1,
} from '../src/strategic-audit-roadmap-consistency-repair-v1/index.js';
import { generalPurposeCodeGenerationProven } from '../src/general-purpose-code-generation-v1/general-purpose-code-generation-assessor.js';
import { buildMissingCapabilitiesReport } from '../src/capability-audit-v3/missing-capabilities.js';
import { buildCodeGenerationAssessment } from '../src/capability-audit-v3/code-generation-assessment.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_REPORT_TITLE);

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('Strategic Audit Roadmap Consistency Repair V1 — Validation');
  console.log('==========================================================');
  console.log('');

  const requiredFiles = [
    'src/strategic-audit-roadmap-consistency-repair-v1/strategic-audit-roadmap-consistency-authority.ts',
    'src/strategic-capability-audit-v4/strategic-proven-capability-registry.ts',
    'src/strategic-capability-audit-v4/strategic-roadmap-evidence-builder.ts',
    'src/strategic-audit-roadmap-consistency-repair-v1/index.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:strategic-audit-roadmap-consistency-repair-v1']),
    'script',
  );

  assert('02. GP V1 proven', generalPurposeCodeGenerationProven(ROOT), 'PASS');

  const assessment = runStrategicAuditRoadmapConsistencyRepairV1({ projectRootDir: ROOT });
  const reportMarkdown = buildStrategicAuditRoadmapConsistencyRepairV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('03. consistency proof status', assessment.consistencyProofStatus === 'PROVEN', assessment.consistencyProofStatus);
  assert('04. audits agree', assessment.auditsAgree, 'agree');
  assert('05. GP V1 COMPLETE in roadmap', assessment.generalPurposeV1CompleteInRoadmap, 'complete');
  assert('06. GP V1 not top gap', assessment.generalPurposeV1NotTopGap, 'not top');
  assert('07. zero conflicts', assessment.conflictingItems === 0, String(assessment.conflictingItems));
  assert('08. evidence-driven roadmap', assessment.evidenceDrivenRoadmapProven, 'evidence');
  assert(
    '09. completed cannot reappear',
    assessment.completedCapabilitiesCannotReappear,
    'reappear',
  );
  assert(
    '10. pass token',
    assessment.passToken === STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN,
    assessment.passToken,
  );

  const gpRoadmap = assessment.resolvedPriorities.find(
    (p) => p.phase === 'General-Purpose Code Generation',
  );
  assert('11. GP roadmap action COMPLETE', gpRoadmap?.action === 'COMPLETE', gpRoadmap?.action ?? 'missing');

  const topPriority = assessment.resolvedPriorities[0];
  assert(
    '12. top priority not GP EXTEND',
    topPriority?.phase !== 'General-Purpose Code Generation' || topPriority?.action === 'COMPLETE',
    `${topPriority?.phase ?? 'n/a'} ${topPriority?.action ?? ''}`,
  );

  const codegen = buildCodeGenerationAssessment({ projectRootDir: ROOT });
  const missing = buildMissingCapabilitiesReport({
    projectRootDir: ROOT,
    codeGenerationMaturityScore: codegen.codeGenerationMaturityScore,
  });
  assert(
    '13. capability audit GP gap closed',
    !missing.entries.some((e) => e.capability.includes('General-purpose code generation')),
    'closed',
  );

  for (const file of [
    'assessment.json',
    'consistency-analysis.json',
    'roadmap-conflicts.json',
    'resolved-priorities.json',
  ]) {
    assert(`14. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('15. report written', existsSync(REPORT_PATH), STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_REPORT_TITLE);

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Strategic Audit Roadmap Consistency Repair V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN);
  console.log(
    `Consistency: ${assessment.consistentItems} consistent, ${assessment.conflictingItems} conflicts, top priority: ${topPriority?.phase ?? 'n/a'}`,
  );
}

main();
