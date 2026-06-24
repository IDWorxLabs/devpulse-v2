/**
 * General-Purpose Code Generation Gap Investigation — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildGeneralPurposeCodeGenerationGapInvestigationReportMarkdown,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE,
  runGeneralPurposeCodeGenerationGapInvestigation,
} from '../src/general-purpose-code-generation-gap-investigation/index.js';
import { generalPurposeCodeGenerationProven } from '../src/general-purpose-code-generation-v1/general-purpose-code-generation-assessor.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE);

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('General-Purpose Code Generation Gap Investigation — Validation');
  console.log('==============================================================');
  console.log('');

  const requiredFiles = [
    'src/general-purpose-code-generation-gap-investigation/general-purpose-code-generation-gap-investigation-assessor.ts',
    'src/general-purpose-code-generation-gap-investigation/gap-evidence-analyzer.ts',
    'src/general-purpose-code-generation-gap-investigation/index.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:general-purpose-code-generation-gap-investigation']),
    'script',
  );

  assert('02. GP V1 proven on disk', generalPurposeCodeGenerationProven(ROOT), 'GP V1 PASS');

  const assessment = runGeneralPurposeCodeGenerationGapInvestigation({ projectRootDir: ROOT });
  const reportMarkdown = buildGeneralPurposeCodeGenerationGapInvestigationReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('03. investigation proof status', assessment.investigationProofStatus === 'PROVEN', assessment.investigationProofStatus);
  assert('04. GP V1 proven confirmed', assessment.generalPurposeV1Proven, 'proven');
  assert('05. not a real V1 gap', !assessment.realCapabilityGapExists, 'real gap');
  assert('06. no stale evidence', !assessment.staleEvidenceDetected, 'stale');
  assert('07. audit state assessed', assessment.auditDisagreementDetected || assessment.generalPurposeV1Proven, 'assessed');
  assert('08. roadmap state assessed', assessment.roadmapInconsistencyDetected !== undefined, 'inconsistency');
  assert(
    '09. gap source identified',
    assessment.gapProducingAuditSource.length > 0,
    assessment.gapProducingAuditSource,
  );
  assert('10. capability audit agrees with V1', assessment.capabilityAuditAgreesWithV1Pass, 'cap audit');
  assert(
    '11. strategic audit aligned or repaired',
    assessment.strategicAuditAgreesWithV1Pass || assessment.auditDisagreementDetected,
    String(assessment.strategicAuditAgreesWithV1Pass),
  );
  assert(
    '12. verdict documented',
    assessment.verdict === 'ROADMAP_INCONSISTENCY' ||
      assessment.verdict === 'AUDIT_DISAGREEMENT' ||
      assessment.verdict === 'REAL_CAPABILITY_GAP',
    assessment.verdict,
  );
  assert('13. should mark V1 complete', assessment.shouldV1RemainComplete, 'complete');
  assert(
    '14. pass token',
    assessment.passToken === GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN,
    assessment.passToken,
  );

  for (const file of [
    'assessment.json',
    'evidence-analysis.json',
    'roadmap-consistency.json',
    'remaining-codegen-gaps.json',
  ]) {
    assert(`15. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('16. report written', existsSync(REPORT_PATH), GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE);

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`General-Purpose Code Generation Gap Investigation — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN);
  console.log(`Verdict: ${assessment.verdict} — ${assessment.verdictSummary.slice(0, 100)}`);
}

main();
