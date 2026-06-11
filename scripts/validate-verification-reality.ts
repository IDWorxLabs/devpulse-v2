/**
 * Phase 24A.3 — Verification Reality validation (leaf mode).
 * No workspace snapshot, no brain calls, no nested validators, no execSync/spawnSync.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VERIFICATION_REALITY_PASS_TOKEN,
  analyzeBuildOutputLink,
  analyzeValidationInventory,
  assessVerificationReality,
  buildVerificationWorkspaceSignalsForValidation,
  detectVerificationModulePresenceEvidence,
  getVerificationHistoryCount,
  getVerificationRegistryCount,
  resetVerificationRealityCounterForTests,
  resetVerificationRealityHistoryForTests,
  resetVerificationRealityRegistryForTests,
  resolveEvidenceChainBreakPoint,
  runAllVerificationRealityAnalyzers,
  writeVerificationRealityReportFile,
} from '../src/verification-reality/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const STATIC_SCAN_FILES = [
  'src/verification-reality/verification-reality-authority.ts',
  'src/verification-reality/verification-reality-analyzers.ts',
  'src/verification-reality/verification-reality-types.ts',
  'src/verification-reality/verification-reality-bounds.ts',
  'src/verification-reality/verification-reality-registry.ts',
  'src/verification-reality/verification-reality-history.ts',
  'src/verification-reality/verification-reality-analyzer-types.ts',
  'package.json',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 256_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Verification Reality — Validation (leaf mode)');
  console.log('=============================================');
  console.log('');

  checkpoint('start');
  resetVerificationRealityCounterForTests();
  resetVerificationRealityRegistryForTests();
  resetVerificationRealityHistoryForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const authority = fileTexts.get('src/verification-reality/verification-reality-authority.ts') ?? '';
  const analyzers = fileTexts.get('src/verification-reality/verification-reality-analyzers.ts') ?? '';
  const types = fileTexts.get('src/verification-reality/verification-reality-types.ts') ?? '';
  const bounds = fileTexts.get('src/verification-reality/verification-reality-bounds.ts') ?? '';
  const registry = fileTexts.get('src/verification-reality/verification-reality-registry.ts') ?? '';
  const history = fileTexts.get('src/verification-reality/verification-reality-history.ts') ?? '';
  const analyzerTypes = fileTexts.get('src/verification-reality/verification-reality-analyzer-types.ts') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-types.ts')), 'types');
  assert('03. bounds module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-bounds.ts')), 'bounds');
  assert('04. registry module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-registry.ts')), 'registry');
  assert('05. history module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-history.ts')), 'history');
  assert('06. analyzers module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-analyzers.ts')), 'analyzers');
  assert('07. analyzer types module', existsSync(join(ROOT, 'src/verification-reality/verification-reality-analyzer-types.ts')), 'analyzer-types');
  assert('08. package script', Boolean(pkg.scripts?.['validate:verification-reality']), 'package');
  assert('09. assessment types', types.includes('VerificationRealityAssessment') && types.includes('VerificationRealityEvidence'), 'types');
  assert('10. inventory analyzer', analyzers.includes('analyzeValidationInventory') && analyzerTypes.includes('VERIFICATION_OBSERVED'), 'inventory');
  assert('11. runtime link analyzer', analyzers.includes('analyzeRuntimeLink') && analyzerTypes.includes('RUNTIME_LINK_PROVEN'), 'runtime');
  assert('12. build output analyzer', analyzers.includes('analyzeBuildOutputLink') && analyzerTypes.includes('BUILD_OUTPUT_LINK_MISSING'), 'build');
  assert('13. preview link analyzer', analyzers.includes('analyzePreviewLink') && analyzerTypes.includes('PREVIEW_LINK_PARTIAL'), 'preview');
  assert('14. evidence chain analyzer', analyzers.includes('analyzeEvidenceChain') && analyzerTypes.includes('EVIDENCE_CHAIN_PROVEN'), 'chain');
  assert('15. authority builder', authority.includes('assessVerificationReality') && authority.includes('verificationRealityScore'), 'authority');
  assert('16. report generation', authority.includes('buildVerificationRealityReport'), 'report');
  assert('17. claimed observed proven matrix', authority.includes('verificationRealityMatrix') && types.includes('VerificationRealityMatrixRow'), 'matrix');
  assert('18. bounded registry', registry.includes('MAX_REGISTRY_ENTRIES'), 'registry bounds');
  assert('19. bounded history', history.includes('MAX_HISTORY_ENTRIES'), 'history bounds');
  assert('20. pass token constant', bounds.includes("VERIFICATION_REALITY_PASS_TOKEN = 'VERIFICATION_REALITY_PASS'"), 'token');
  assert('21. validator count not proof', analyzers.includes('validator count is not proof') && authority.includes('Validator count'), 'count rule');
  assert('22. pass token not proof', authority.includes('pass token') && authority.includes('pass token/URL'), 'token rule');
  assert('23. URL route panel not proof', authority.includes('URL exists') && authority.includes('Route exists') && authority.includes('panel exists'), 'surface rule');
  assert('24. linkage required for proof', authority.includes('RUNTIME_LINK_PROVEN') && authority.includes('BUILD_OUTPUT_LINK_PROVEN'), 'linkage');
  assert('25. no nested validator cascade', !authority.includes("execSync('npm run validate:") && !authority.includes('spawnSync'), 'cascade');
  assert('26. no future-state scoring', authority.includes('No future-state scoring'), 'future');
  assert('27. score cap disconnected builder', authority.includes('executionConnected') && authority.includes('Math.min(verificationRealityScore'), 'cap');
  checkpoint('static checks complete');

  const moduleEvidence = detectVerificationModulePresenceEvidence(ROOT);
  checkpoint('module evidence detected');
  const workspaceSignals = buildVerificationWorkspaceSignalsForValidation(moduleEvidence);
  checkpoint('leaf workspace signals built');

  const assessment = assessVerificationReality({
    workspace: workspaceSignals,
    moduleEvidence,
  });
  checkpoint('authority assessment complete');

  assert('28. score range', assessment.verificationRealityScore >= 0 && assessment.verificationRealityScore <= 100, String(assessment.verificationRealityScore));
  assert('29. matrix five rows', assessment.verificationRealityMatrix.length === 5, String(assessment.verificationRealityMatrix.length));
  assert('30. registry bounded', getVerificationRegistryCount() <= 16, String(getVerificationRegistryCount()));
  assert('31. history bounded', getVerificationHistoryCount() <= 32, String(getVerificationHistoryCount()));
  assert(
    '32. verification status enum',
    assessment.verificationStatus === 'VERIFICATION_CLAIMED' ||
      assessment.verificationStatus === 'VERIFICATION_OBSERVED' ||
      assessment.verificationStatus === 'VERIFICATION_PROVEN',
    assessment.verificationStatus,
  );
  assert(
    '33. chain break BUILD when execution disconnected',
    workspaceSignals.executionConnected === false ? assessment.evidenceChainBreakPoint === 'BUILD' : true,
    assessment.evidenceChainBreakPoint,
  );
  assert(
    '34. optimistic scoring prohibited',
    !workspaceSignals.executionConnected ? assessment.verificationRealityScore <= 44 : true,
    String(assessment.verificationRealityScore),
  );
  assert(
    '35. high validator count not high proof',
    moduleEvidence.validatorScriptCount > 20 ? assessment.verificationRealityScore <= 56 : true,
    String(assessment.verificationRealityScore),
  );

  const inventoryOnlyInput = {
    workspace: buildVerificationWorkspaceSignalsForValidation(moduleEvidence, {
      executionConnected: false,
      founderTestingConsumesPreview: false,
      founderTestingConsumesBuild: false,
      verificationResultsLinked: false,
      previewValidationReady: false,
    }),
    moduleEvidence: {
      ...moduleEvidence,
      validatorScriptCount: 80,
      founderTestingConsumesPreview: false,
      founderTestingConsumesBuild: false,
      verificationResultsLinked: false,
    },
  };
  assert(
    '36. inventory observed not proven',
    analyzeValidationInventory(inventoryOnlyInput) === 'VERIFICATION_OBSERVED',
    analyzeValidationInventory(inventoryOnlyInput),
  );
  assert(
    '37. build link missing when disconnected',
    analyzeBuildOutputLink(inventoryOnlyInput) === 'BUILD_OUTPUT_LINK_MISSING' ||
      analyzeBuildOutputLink(inventoryOnlyInput) === 'BUILD_OUTPUT_LINK_PARTIAL',
    analyzeBuildOutputLink(inventoryOnlyInput),
  );
  checkpoint('runtime analyzer checks complete');

  const reportPath = writeVerificationRealityReportFile(assessment, ROOT);
  assert('38. reality report written', existsSync(reportPath), reportPath);
  const reportText = readBoundedText('architecture/VERIFICATION_REALITY_REPORT.md', 128_000);
  assert('39. report executive summary', reportText.includes('Executive Summary') && reportText.includes('Verification Reality Score'), 'report');
  assert('40. report matrix section', reportText.includes('Verification Reality Matrix'), 'matrix');
  assert('41. report founder conclusion', reportText.includes('Founder Conclusion'), 'conclusion');
  assert('42. report chain break point', reportText.includes('Evidence chain break point'), 'chain');
  checkpoint('report written');

  const analyzersResult = runAllVerificationRealityAnalyzers({ workspace: workspaceSignals, moduleEvidence });
  assert(
    '43. resolve break point',
    resolveEvidenceChainBreakPoint({ workspace: workspaceSignals, moduleEvidence }) === analyzersResult.evidenceChainBreakPoint,
    analyzersResult.evidenceChainBreakPoint,
  );
  checkpoint('analyzer consistency verified');

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Verification Reality Score: ${assessment.verificationRealityScore}/100`);
  console.log(`Verification status: ${assessment.verificationStatus}`);
  console.log(`Evidence chain break: ${assessment.evidenceChainBreakPoint}`);
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('VERIFICATION_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(VERIFICATION_REALITY_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('VERIFICATION_REALITY_REQUIRES_FIXES');
  process.exit(1);
}
