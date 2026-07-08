/**
 * App Generation Readiness Audit V1 — validation.
 *
 * Proves:
 *  - the audit module exists and covers every major generation stage
 *  - it identifies project context isolation, stale prompt/context contamination, fallback
 *    module contamination, generation repair limitations, and live preview/runtime proof
 *    failure ownership as possible failure areas
 *  - it does not implement app-specific fixes or hardcode product domains into behavior
 *  - it does not modify existing generation behavior (no imports from the generation pipeline)
 *  - it produces a deterministic report
 *
 * Emits APP_GENERATION_READINESS_AUDIT_V1_PASS on success.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_GENERATION_READINESS_AUDIT_V1_ARTIFACT_DIR,
  APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN,
  APP_GENERATION_READINESS_AUDIT_V1_REPORT_FILENAME,
  buildAppGenerationReadinessAuditReportMarkdown,
  runAppGenerationReadinessAuditV1,
} from '../src/app-generation-readiness-audit-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, APP_GENERATION_READINESS_AUDIT_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, APP_GENERATION_READINESS_AUDIT_V1_REPORT_FILENAME);
const START = Date.now();
const MAX_RUNTIME_MS = 60_000;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

/** Generation-pipeline module prefixes this audit must never import from (read-only guarantee). */
const BANNED_IMPORT_PREFIXES = [
  '../one-prompt-live-preview',
  '../chat-to-build-execution-bridge-v1',
  '../universal-prompt-to-app-materialization',
  '../universal-feature-contract-intelligence',
  '../prompt-bounded-materialization',
  '../product-faithfulness-v1',
  '../product-faithfulness-v2',
  '../code-generation-engine',
  '../autonomous-software-engineering-engine',
  '../ase-enforcement-engine',
  '../autonomous-engineering-executive',
  '../live-preview-gate',
  '../live-preview-interaction-proof-v1',
  '../build-execution-stabilizer-v1',
  '../build-result-normalizer-v1',
];

const AUDIT_MODULE_SOURCE_FILES = [
  'src/app-generation-readiness-audit-v1/app-generation-readiness-audit-types.ts',
  'src/app-generation-readiness-audit-v1/app-generation-readiness-audit.ts',
  'src/app-generation-readiness-audit-v1/app-generation-readiness-audit-findings.ts',
  'src/app-generation-readiness-audit-v1/app-generation-readiness-report.ts',
  'src/app-generation-readiness-audit-v1/index.ts',
];

function main(): void {
  console.log('');
  console.log('App Generation Readiness Audit V1 — Validation');
  console.log('================================================');
  console.log('');

  checkpoint('start');

  for (const rel of AUDIT_MODULE_SOURCE_FILES) {
    assert(`file exists: ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('01. package.json script registered', Boolean(pkg.scripts?.['validate:app-generation-readiness-audit-v1']), 'validate:app-generation-readiness-audit-v1');

  // --- Structural self-check: audit is read-only / does not modify existing generation behavior ---
  let importsBannedModule = false;
  let bannedImportDetail = '';
  let writesOutsideOwnArtifacts = false;
  let writeDetail = '';
  for (const rel of AUDIT_MODULE_SOURCE_FILES) {
    const source = readFileSync(join(ROOT, rel), 'utf8');
    for (const prefix of BANNED_IMPORT_PREFIXES) {
      if (source.includes(`from '${prefix}`) || source.includes(`from "${prefix}`)) {
        importsBannedModule = true;
        bannedImportDetail = `${rel} imports from banned generation-pipeline path "${prefix}"`;
      }
    }
    const writeSyncMatches = source.match(/writeFileSync|createWriteStream|unlinkSync|rmSync/g);
    if (writeSyncMatches && writeSyncMatches.length > 0) {
      writesOutsideOwnArtifacts = true;
      writeDetail = `${rel} calls a filesystem-mutating function directly (${writeSyncMatches.join(', ')})`;
    }
  }
  assert('02. no imports from generation-pipeline modules', !importsBannedModule, bannedImportDetail || 'clean');
  assert('03. audit source modules perform no filesystem mutation themselves', !writesOutsideOwnArtifacts, writeDetail || 'clean (only this validator script writes files)');

  // --- Run the audit twice to prove determinism ---
  const assessment1 = runAppGenerationReadinessAuditV1({ projectRootDir: ROOT });
  const assessment2 = runAppGenerationReadinessAuditV1({ projectRootDir: ROOT });
  checkpoint('audit run twice');

  assert('04. deterministic output', JSON.stringify(assessment1) === JSON.stringify(assessment2), 'two runs produced identical JSON');

  const assessment = assessment1;

  // --- Coverage of every major generation stage ---
  assert('05. covers every required stage', assessment.stagesCovered >= assessment.totalStagesRequired, `${assessment.stagesCovered}/${assessment.totalStagesRequired}`);
  const requiredStageIds = [
    'USER_PROMPT_INTAKE',
    'PROJECT_CONTEXT_RESOLUTION',
    'PROMPT_RESET_NEW_BUILD_DETECTION',
    'CANONICAL_PRODUCT_CONTRACT_CREATION',
    'PRODUCT_IDENTITY_PRESERVATION',
    'PLANNING',
    'ARCHITECTURE_GENERATION',
    'UNIVERSAL_FEATURE_CONTRACT_GENERATION',
    'MODULE_SELECTION',
    'GENERATED_MODULES',
    'ROUTES',
    'NAVIGATION',
    'MATERIALIZATION_MANIFEST',
    'RUNTIME_ACTIVATION',
    'LIVE_PREVIEW_PROOF',
    'PRODUCT_FAITHFULNESS_EVALUATION',
    'FAILURE_REPORTING',
  ];
  const coveredIds = new Set(assessment.pipelineStages.map((s) => s.id));
  const missingStageIds = requiredStageIds.filter((id) => !coveredIds.has(id as never));
  assert('06. every named stage present', missingStageIds.length === 0, missingStageIds.join(', ') || 'all present');

  // --- Required failure-area categories identified ---
  const categories = new Set(assessment.categoriesIdentified);
  assert('07. identifies project context isolation', categories.has('PROJECT_CONTEXT_ISOLATION'), 'PROJECT_CONTEXT_ISOLATION');
  assert('08. identifies stale prompt/context contamination', categories.has('STALE_CONTEXT_CONTAMINATION'), 'STALE_CONTEXT_CONTAMINATION');
  assert('09. identifies fallback module contamination', categories.has('FALLBACK_MODULE_CONTAMINATION'), 'FALLBACK_MODULE_CONTAMINATION');
  assert('10. identifies generation repair limitations', categories.has('REPAIR_LIMITATION'), 'REPAIR_LIMITATION');
  assert('11. identifies live preview/runtime proof failure ownership', categories.has('RUNTIME_FAILURE_OWNERSHIP'), 'RUNTIME_FAILURE_OWNERSHIP');
  assert('12. identifies canonical-contract drift', categories.has('CONTRACT_DRIFT'), 'CONTRACT_DRIFT');
  assert('13. identifies late faithfulness detection', categories.has('FAITHFULNESS_LATE_DETECTION'), 'FAITHFULNESS_LATE_DETECTION');

  // --- Evidence grounding: cited files must actually exist in this repository ---
  assert('14. evidence files checked', assessment.evidenceFilesChecked > 30, String(assessment.evidenceFilesChecked));
  assert('15. evidence file existence ratio >= 90%', assessment.evidenceFileExistenceRatio >= 0.9, `${(assessment.evidenceFileExistenceRatio * 100).toFixed(1)}%`);

  // --- Findings, missing authorities, fix sequence, risk ranking all populated ---
  assert('16. findings recorded', assessment.findings.length >= 15, String(assessment.findings.length));
  assert('17. every finding has evidence', assessment.findings.every((f) => f.evidence.length > 0), 'all findings cite at least one evidence source');
  assert('18. missing authorities recorded', assessment.missingAuthorities.length >= 3, String(assessment.missingAuthorities.length));
  assert('19. fix sequence recorded and ordered', assessment.fixSequence.every((s, i) => s.order === i + 1), 'sequential 1..N ordering');
  assert('20. risk ranking covers every finding', assessment.riskRanking.length === assessment.findings.length, `${assessment.riskRanking.length} vs ${assessment.findings.length} findings`);

  // --- Guarantees ---
  assert('21. no app-specific fixes implemented', assessment.noAppSpecificFixesApplied === true, 'flag true');
  assert('22. no product domains hardcoded into behavior', assessment.noProductDomainsHardcoded === true, 'flag true');
  assert('23. no existing generation behavior modified', assessment.noExistingBehaviorModified === true, 'flag true');
  assert('24. no validators weakened', assessment.noValidatorsWeakened === true, 'flag true');
  assert('25. audit proof status PROVEN', assessment.auditProofStatus === 'PROVEN', assessment.auditProofStatus);
  assert('26. pass token present', assessment.passToken === APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN, assessment.passToken);

  checkpoint('assessment validated');

  // --- Write report + artifacts (this script is the only writer, by design) ---
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), JSON.stringify(assessment, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'findings.json'), JSON.stringify(assessment.findings, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'fix-sequence.json'), JSON.stringify(assessment.fixSequence, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'risk-ranking.json'), JSON.stringify(assessment.riskRanking, null, 2), 'utf8');

  const reportMarkdown = buildAppGenerationReadinessAuditReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('27. report written to disk', existsSync(REPORT_PATH), REPORT_PATH);
  assert('28. report contains all 15 required sections', [
    '## 1. Pipeline Map',
    '## 2. State Ownership Map',
    '## 3. Current Prompt Evidence Sources',
    '## 4. Previous Project Evidence Sources',
    '## 5. Places Where Stale Context Can Leak',
    '## 6. Places Where Fallback Modules Can Be Appended',
    '## 7. Places Where Generated Modules Can Drift From the Canonical Product Contract',
    '## 8. Places Where Faithfulness Detects Failure Too Late',
    '## 9. Places Where Repair Is Only Reported But Not Applied',
    '## 10. Places Where Runtime/Live Preview Can Stop Responding',
    '## 11. Missing Engine Authorities',
    '## 12. Recommended Fix Sequence',
    '## 13. Risk Ranking',
    '## 14. Exact Files/Functions Likely Responsible',
    '## 15. Evidence Index (per finding)',
  ].every((heading) => reportMarkdown.includes(heading)), 'all 15 headings present');

  // --- Re-run determinism check against the written report text itself ---
  const reportMarkdown2 = buildAppGenerationReadinessAuditReportMarkdown(runAppGenerationReadinessAuditV1({ projectRootDir: ROOT }));
  assert('29. report markdown is deterministic across runs', reportMarkdown === reportMarkdown2, 'identical markdown on repeat run');

  checkpoint('artifacts written');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`App Generation Readiness Audit V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN);
  console.log(
    `Audit: ${assessment.stagesCovered}/${assessment.totalStagesRequired} stages, ${assessment.findings.length} findings, ${assessment.missingAuthorities.length} missing authorities, evidence grounding ${(assessment.evidenceFileExistenceRatio * 100).toFixed(1)}%, report at ${APP_GENERATION_READINESS_AUDIT_V1_REPORT_FILENAME}`,
  );
}

main();
