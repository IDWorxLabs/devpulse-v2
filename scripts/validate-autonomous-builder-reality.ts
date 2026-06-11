/**
 * Phase 24A.1 — Autonomous Builder Reality validation (leaf mode).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTONOMOUS_BUILDER_REALITY_PASS_TOKEN,
  analyzeAutonomousCompletion,
  analyzeBuildExecutionReality,
  analyzeFileGenerationReality,
  analyzePlanningReality,
  analyzeValidationReality,
  assessAutonomousBuilderReality,
  detectModulePresenceEvidence,
  getBuilderRealityHistoryCount,
  getBuilderRealityRegistryCount,
  listBuilderRealityHistory,
  resetAutonomousBuilderRealityCounterForTests,
  resetAutonomousBuilderRealityHistoryForTests,
  resetAutonomousBuilderRealityRegistryForTests,
  runAllBuilderRealityAnalyzers,
} from '../src/autonomous-builder-reality/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function guardRuntime(group: string): void {
  if (Date.now() - START > MAX_RUNTIME_MS) {
    throw new Error(`Timeout in ${group} after ${Date.now() - START}ms`);
  }
}

function main(): void {
  console.log('');
  console.log('Autonomous Builder Reality — Validation');
  console.log('========================================');
  console.log('');

  resetAutonomousBuilderRealityCounterForTests();
  resetAutonomousBuilderRealityRegistryForTests();
  resetAutonomousBuilderRealityHistoryForTests();

  const authority = readText('src/autonomous-builder-reality/autonomous-builder-reality-authority.ts');
  const analyzers = readText('src/autonomous-builder-reality/autonomous-builder-reality-analyzers.ts');
  const types = readText('src/autonomous-builder-reality/autonomous-builder-reality-types.ts');
  const registry = readText('src/autonomous-builder-reality/autonomous-builder-reality-registry.ts');
  const history = readText('src/autonomous-builder-reality/autonomous-builder-reality-history.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/autonomous-builder-reality/autonomous-builder-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/autonomous-builder-reality/autonomous-builder-reality-types.ts')), 'types');
  assert('03. registry module', existsSync(join(ROOT, 'src/autonomous-builder-reality/autonomous-builder-reality-registry.ts')), 'registry');
  assert('04. history module', existsSync(join(ROOT, 'src/autonomous-builder-reality/autonomous-builder-reality-history.ts')), 'history');
  assert('05. analyzers module', existsSync(join(ROOT, 'src/autonomous-builder-reality/autonomous-builder-reality-analyzers.ts')), 'analyzers');
  assert('06. package script', Boolean(pkg.scripts?.['validate:autonomous-builder-reality']), 'package');
  assert('07. assessment types', types.includes('AutonomousBuilderRealityAssessment') && types.includes('BuilderExecutionEvidence'), 'types');
  assert('08. planning analyzer', analyzers.includes('analyzePlanningReality') && analyzers.includes('PLANNING_PARTIAL'), 'planning');
  assert('09. file generation analyzer', analyzers.includes('analyzeFileGenerationReality') && analyzers.includes('FILE_GENERATION_UNPROVEN'), 'file');
  assert('10. build execution analyzer', analyzers.includes('BUILD_CAPABILITY_CLAIMED') && analyzers.includes('BUILD_CAPABILITY_PROVEN'), 'build');
  assert('11. validation analyzer', analyzers.includes('analyzeValidationReality') && analyzers.includes('VALIDATION_PARTIAL'), 'validation');
  assert('12. completion analyzer', analyzers.includes('analyzeAutonomousCompletion') && analyzers.includes('AUTONOMOUS_BLOCKED'), 'completion');
  assert('13. authority builder', authority.includes('assessAutonomousBuilderReality') && authority.includes('builderRealityScore'), 'authority');
  assert('14. report generation', authority.includes('buildAutonomousBuilderRealityReport'), 'report');
  assert('15. evidence model', types.includes('EvidenceLevel') && authority.includes('collectBuilderExecutionEvidence'), 'evidence');
  assert('16. claimed observed proven matrix', authority.includes('capabilityMatrix') && types.includes('CapabilityMatrixRow'), 'matrix');
  assert('17. bounded registry', registry.includes('MAX_REGISTRY_ENTRIES'), 'registry bounds');
  assert('18. bounded history', history.includes('MAX_HISTORY_ENTRIES'), 'history bounds');
  assert('19. no nested validator cascade', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('20. no fake pass tokens', AUTONOMOUS_BUILDER_REALITY_PASS_TOKEN === 'AUTONOMOUS_BUILDER_REALITY_PASS', 'token');
  guardRuntime('static');

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const moduleEvidence = detectModulePresenceEvidence(ROOT);

  const input = {
    workspace: {
      world2FoundationComplete: snapshot.autonomousBuilder.world2FoundationComplete,
      executionConnected: snapshot.autonomousBuilder.executionConnected,
      readiness: snapshot.autonomousBuilder.readiness,
      readinessLabel: snapshot.autonomousBuilder.readinessLabel,
      livePreviewConnected: snapshot.livePreview.connected,
    },
    moduleEvidence,
  };

  const assessment = assessAutonomousBuilderReality(input);

  assert('21. assessment executes', assessment.builderRealityScore >= 0 && assessment.builderRealityScore <= 100, String(assessment.builderRealityScore));
  assert('22. all analyzers run', Boolean(assessment.analyzers.planningReality && assessment.analyzers.autonomousCompletion), assessment.analyzers.planningReality);
  assert('23. evidence collected', assessment.evidence.length > 0, String(assessment.evidence.length));
  assert('24. capability matrix populated', assessment.capabilityMatrix.length >= 6, String(assessment.capabilityMatrix.length));
  assert('25. missing evidence listed', assessment.missingEvidence.length > 0, String(assessment.missingEvidence.length));
  assert('26. founder conclusion present', assessment.founderConclusion.length > 40, assessment.founderConclusion.slice(0, 40));
  assert('27. report markdown generated', assessment.report.markdown.includes('Executive Summary') && assessment.report.markdown.includes('Founder Conclusion'), 'md');
  assert('28. registry stores assessment', getBuilderRealityRegistryCount() >= 1, String(getBuilderRealityRegistryCount()));
  assert('29. history stores assessment', getBuilderRealityHistoryCount() >= 1, String(getBuilderRealityHistoryCount()));
  assert(
    '30. no optimistic scoring without execution',
    !input.workspace.executionConnected ? assessment.builderRealityScore <= 52 : true,
    String(assessment.builderRealityScore),
  );
  assert(
    '31. execution not connected conclusion honest',
    !input.workspace.executionConnected
      ? /not today|cannot prove|not connected/i.test(assessment.founderConclusion)
      : true,
    'honest',
  );
  assert(
    '32. no future capability scoring',
    !/future-state scoring|will be able to|roadmap score/i.test(authority) || authority.includes('no future-state scoring'),
    'reality only',
  );
  assert(
    '33. file generation unproven without execution',
    !input.workspace.executionConnected
      ? assessment.analyzers.fileGenerationReality !== 'FILE_GENERATION_PROVEN'
      : true,
    assessment.analyzers.fileGenerationReality,
  );
  assert(
    '34. build capability not proven without connection',
    !input.workspace.executionConnected
      ? assessment.analyzers.buildCapabilityLevel !== 'BUILD_CAPABILITY_PROVEN'
      : true,
    assessment.analyzers.buildCapabilityLevel,
  );
  guardRuntime('assessment');

  const reportPath = join(ROOT, 'architecture', 'AUTONOMOUS_BUILDER_REALITY_REPORT.md');
  writeFileSync(reportPath, assessment.report.markdown, 'utf8');
  assert('35. report file written', existsSync(reportPath), reportPath);

  const analyzerBundle = runAllBuilderRealityAnalyzers(input);
  assert('36. planning analyzer callable', analyzePlanningReality(input) === analyzerBundle.planningReality, analyzerBundle.planningReality);
  assert('37. file analyzer callable', analyzeFileGenerationReality(input) === analyzerBundle.fileGenerationReality, analyzerBundle.fileGenerationReality);
  assert('38. build analyzer callable', analyzeBuildExecutionReality(input) === analyzerBundle.buildCapabilityLevel, analyzerBundle.buildCapabilityLevel);
  assert('39. validation analyzer callable', analyzeValidationReality(input) === analyzerBundle.validationReality, analyzerBundle.validationReality);
  assert('40. completion analyzer callable', analyzeAutonomousCompletion(input).level === analyzerBundle.autonomousCompletion, analyzerBundle.autonomousCompletion);
  assert('41. history list readable', listBuilderRealityHistory().length >= 1, 'history');
  assert(
    '42. matrix distinguishes levels',
    assessment.capabilityMatrix.some((r) => r.observed !== 'NONE' || r.claimed !== 'NONE'),
    'matrix levels',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const runtimeMs = Date.now() - START;

  console.log('');
  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed} | Runtime: ${runtimeMs}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('AUTONOMOUS_BUILDER_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Builder Reality Score: ${assessment.builderRealityScore} | Completion: ${assessment.analyzers.autonomousCompletion} | executionConnected=${input.workspace.executionConnected}`);
  console.log(`Founder conclusion: ${assessment.founderConclusion.slice(0, 120)}…`);
  console.log('');
  console.log(AUTONOMOUS_BUILDER_REALITY_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
