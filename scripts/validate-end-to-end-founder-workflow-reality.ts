/**
 * Phase 24A.4 — End-to-End Founder Workflow Reality validation (leaf mode).
 * No workspace snapshot, no brain, no nested validators, no execSync/spawnSync.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  END_TO_END_FOUNDER_WORKFLOW_REALITY_PASS_TOKEN,
  assessFounderWorkflowReality,
  getFounderWorkflowHistoryCount,
  getFounderWorkflowRegistryCount,
  resetFounderWorkflowRealityCounterForTests,
  resetFounderWorkflowRealityHistoryForTests,
  resetFounderWorkflowRealityRegistryForTests,
  writeFounderWorkflowRealityReportFile,
} from '../src/end-to-end-founder-workflow-reality/index.js';

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
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-authority.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-types.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-bounds.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-registry.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-history.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzer-types.ts',
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
  console.log('End-to-End Founder Workflow Reality — Validation (leaf mode)');
  console.log('============================================================');
  console.log('');

  checkpoint('start');
  resetFounderWorkflowRealityCounterForTests();
  resetFounderWorkflowRealityRegistryForTests();
  resetFounderWorkflowRealityHistoryForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const authority = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-authority.ts') ?? '';
  const analyzers = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts') ?? '';
  const types = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-types.ts') ?? '';
  const bounds = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-bounds.ts') ?? '';
  const registry = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-registry.ts') ?? '';
  const history = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-history.ts') ?? '';
  const analyzerTypes = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzer-types.ts') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-types.ts')), 'types');
  assert('03. bounds module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-bounds.ts')), 'bounds');
  assert('04. registry module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-registry.ts')), 'registry');
  assert('05. history module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-history.ts')), 'history');
  assert('06. analyzers module', existsSync(join(ROOT, 'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts')), 'analyzers');
  assert('07. package script', Boolean(pkg.scripts?.['validate:end-to-end-founder-workflow-reality']), 'package');
  assert('08. assessment types', types.includes('FounderWorkflowRealityAssessment') && types.includes('FounderWorkflowEvidence'), 'types');
  assert('09. stage model', analyzerTypes.includes('IDEA') && analyzers.includes('analyzeWorkflowStageReality'), 'stages');
  assert('10. continuity model', analyzers.includes('analyzeWorkflowContinuity') && analyzerTypes.includes('CONTINUITY_BROKEN'), 'continuity');
  assert('11. founder experience model', analyzers.includes('analyzeFounderExperience') && analyzerTypes.includes('FOUNDER_BLOCKED'), 'experience');
  assert('12. launch readiness model', analyzers.includes('analyzeLaunchReadinessReality') && analyzerTypes.includes('LAUNCH_READINESS_UNAVAILABLE'), 'launch');
  assert('13. bottleneck model', analyzers.includes('analyzeFounderBottlenecks'), 'bottleneck');
  assert('14. authority builder', authority.includes('assessFounderWorkflowReality') && authority.includes('founderWorkflowRealityScore'), 'authority');
  assert('15. report generation', authority.includes('buildFounderWorkflowRealityReport'), 'report');
  assert('16. truth map section', authority.includes('Founder Workflow Truth Map'), 'truth map');
  assert('17. upstream aggregation', analyzers.includes('collectUpstreamRealityBundle'), 'upstream');
  assert('18. bounded registry', registry.includes('MAX_REGISTRY_ENTRIES'), 'registry');
  assert('19. bounded history', history.includes('MAX_HISTORY_ENTRIES'), 'history');
  assert('20. pass token', bounds.includes("END_TO_END_FOUNDER_WORKFLOW_REALITY_PASS"), 'token');
  assert('21. score caps enforced', authority.includes('Math.min(founderWorkflowRealityScore') && authority.includes('portfolio.build'), 'caps');
  assert('22. optimistic scoring prohibited', authority.includes('executionConnected=false') && authority.includes('Math.min(founderWorkflowRealityScore, 46)'), 'optimistic');
  assert('23. future-state prohibited', authority.includes('No future-state scoring') && authority.includes('roadmap'), 'future');
  assert('24. panel not proof', authority.includes('panel') && authority.includes('menu'), 'panel rule');
  assert('25. no nested cascade', !authority.includes("execSync('npm run validate:") && !authority.includes('spawnSync'), 'cascade');
  assert('26. no workspace snapshot', !analyzers.includes('buildProductWorkspaceSnapshot'), 'snapshot');
  checkpoint('static checks complete');

  const assessment = assessFounderWorkflowReality(ROOT);
  checkpoint('authority assessment complete');

  assert('27. score range', assessment.founderWorkflowRealityScore >= 0 && assessment.founderWorkflowRealityScore <= 100, String(assessment.founderWorkflowRealityScore));
  assert('28. nine workflow stages', assessment.analyzers.stages.length === 9, String(assessment.analyzers.stages.length));
  assert('29. registry bounded', getFounderWorkflowRegistryCount() <= 16, String(getFounderWorkflowRegistryCount()));
  assert('30. history bounded', getFounderWorkflowHistoryCount() <= 32, String(getFounderWorkflowHistoryCount()));
  assert('31. bottleneck BUILD', assessment.currentBottleneck === 'BUILD', assessment.currentBottleneck);
  assert('32. upstream 24A scores present', assessment.upstream.builderScore > 0 && assessment.upstream.previewScore > 0 && assessment.upstream.verificationScore > 0, 'upstream');
  assert('33. build blocked truth map', assessment.analyzers.stages.some((s) => s.stage === 'BUILD' && s.truthLabel === 'BLOCKED'), 'build blocked');
  assert('34. launch unavailable', assessment.launchReadinessStatus === 'LAUNCH_READINESS_UNAVAILABLE', assessment.launchReadinessStatus);
  assert('35. founder blocked experience', assessment.analyzers.founderExperience.level === 'FOUNDER_BLOCKED', assessment.analyzers.founderExperience.level);
  assert('36. score cap with disconnected build', assessment.founderWorkflowRealityScore <= 46, String(assessment.founderWorkflowRealityScore));
  assert('37. continuity broken or partial', assessment.analyzers.continuity !== 'CONTINUITY_PROVEN', assessment.analyzers.continuity);
  checkpoint('runtime checks complete');

  const reportPath = writeFounderWorkflowRealityReportFile(assessment, ROOT);
  assert('38. report written', existsSync(reportPath), reportPath);
  const reportText = readBoundedText('architecture/FOUNDER_WORKFLOW_REALITY_REPORT.md', 128_000);
  assert('39. workflow truth map in report', reportText.includes('Founder Workflow Truth Map'), 'truth map');
  assert('40. continuity map in report', reportText.includes('Workflow Continuity Map'), 'continuity');
  assert('41. founder conclusion in report', reportText.includes('Founder Conclusion'), 'conclusion');
  assert('42. last proven stage in report', reportText.includes('Last proven stage'), 'last proven');
  checkpoint('report written');

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Founder Workflow Reality Score: ${assessment.founderWorkflowRealityScore}/100`);
  console.log(`Last proven stage: ${assessment.lastProvenStage}`);
  console.log(`Current bottleneck: ${assessment.currentBottleneck}`);
  console.log(`Launch readiness: ${assessment.launchReadinessStatus}`);
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('END_TO_END_FOUNDER_WORKFLOW_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(END_TO_END_FOUNDER_WORKFLOW_REALITY_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('END_TO_END_FOUNDER_WORKFLOW_REALITY_REQUIRES_FIXES');
  process.exit(1);
}
