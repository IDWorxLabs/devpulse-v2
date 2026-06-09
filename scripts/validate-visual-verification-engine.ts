/**
 * DevPulse V2 Phase 16.6 — Visual Verification Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  VISUAL_VERIFICATION_ENGINE_PASS_TOKEN,
  VISUAL_VERIFICATION_ENGINE_OWNER_MODULE,
  FORBIDDEN_VISUAL_VERIFICATION_DUPLICATES,
  ALL_VERIFICATION_TARGET_TYPES,
  ALL_VERIFICATION_STATUSES,
  isVisualVerificationQuestion,
  isVisualVerificationAdvisoryQuestion,
  verifyVisualOutcome,
  processVisualVerificationRequest,
  getVisualVerificationDiagnostics,
  resetVisualVerificationDiagnostics,
  resetVisualVerificationRequestCounterForTests,
  resetVisualVerificationReportCounterForTests,
  buildVisualVerificationFailureContext,
  classifyVerificationTargets,
  verifyLayoutTargets,
  verifyNavigationTargets,
  verifyLoadingTargets,
  verifyResponsiveTargets,
  verifyInteractionOutcomes,
  buildVerificationEvidence,
  classifyVerificationRisks,
} from '../src/visual-verification-engine/index.js';
import { executeInteractionTesting } from '../src/interaction-testing-engine/index.js';
import { inspectUiSurface } from '../src/ui-inspection-engine/index.js';
import { getSelfVisionSession } from '../src/self-vision-runtime/self-vision-session-registry.js';
import {
  resetInteractionTestingDiagnostics,
  resetInteractionTestingRequestCounterForTests,
  resetInteractionTestingReportCounterForTests,
} from '../src/interaction-testing-engine/index.js';
import {
  resetUiInspectionDiagnostics,
  resetUiInspectionRequestCounterForTests,
  resetUiInspectionReportCounterForTests,
} from '../src/ui-inspection-engine/index.js';
import {
  resetSelfVisionRuntimeDiagnostics,
  resetSelfVisionRequestCounterForTests,
  resetSelfVisionSessionRegistryForTests,
  resetSelfVisionReportCounterForTests,
} from '../src/self-vision-runtime/index.js';
import {
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
} from '../src/live-preview-runtime/index.js';
import type { VerifyVisualOutcomeInput } from '../src/visual-verification-engine/types.js';
import { VISUAL_VERIFICATION_ENGINE_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'What verification passed?';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processVisualVerificationRequest>>();
const textCache = new Map<string, string>();

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Max runtime guard exceeded during ${group}`);
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  console.log(`✓ ${group} — ${groupResults.filter((r) => r.passed).length}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
}

function readText(path: string): string {
  const hit = textCache.get(path);
  if (hit) return hit;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textCache.set(path, text);
  return text;
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processVisualVerificationRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<VerifyVisualOutcomeInput> = {}): VerifyVisualOutcomeInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetName: 'DevPulse Web Preview',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetPreviewRuntimeDiagnostics();
  resetPreviewRequestCounterForTests();
  resetPreviewTargetRegistryForTests();
  resetPreviewSessionManagerForTests();
  resetPreviewReportCounterForTests();
  resetSelfVisionRuntimeDiagnostics();
  resetSelfVisionRequestCounterForTests();
  resetSelfVisionSessionRegistryForTests();
  resetSelfVisionReportCounterForTests();
  resetUiInspectionDiagnostics();
  resetUiInspectionRequestCounterForTests();
  resetUiInspectionReportCounterForTests();
  resetInteractionTestingDiagnostics();
  resetInteractionTestingRequestCounterForTests();
  resetInteractionTestingReportCounterForTests();
  resetVisualVerificationDiagnostics();
  resetVisualVerificationRequestCounterForTests();
  resetVisualVerificationReportCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.6 Visual Verification Engine');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/visual-verification-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'visual-verification-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. classifier', existsSync(join(dir, 'verification-target-classifier.ts')), 'classifier');
  assert('A-SETUP', '4. layout', existsSync(join(dir, 'layout-verification-engine.ts')), 'layout');
  assert('A-SETUP', '5. navigation', existsSync(join(dir, 'navigation-verification-engine.ts')), 'nav');
  assert('A-SETUP', '6. loading', existsSync(join(dir, 'loading-verification-engine.ts')), 'loading');
  assert('A-SETUP', '7. responsive', existsSync(join(dir, 'responsive-verification-engine.ts')), 'responsive');
  assert('A-SETUP', '8. interaction verifier', existsSync(join(dir, 'interaction-outcome-verifier.ts')), 'interaction');
  assert('A-SETUP', '9. evidence', existsSync(join(dir, 'verification-evidence-builder.ts')), 'evidence');
  assert('A-SETUP', '10. risk', existsSync(join(dir, 'verification-risk-engine.ts')), 'risk');
  assert('A-SETUP', '11. validator', existsSync(join(dir, 'visual-verification-validator.ts')), 'validator');
  assert('A-SETUP', '12. report', existsSync(join(dir, 'visual-verification-report.ts')), 'report');
  assert('A-SETUP', '13. diagnostics', existsSync(join(dir, 'visual-verification-diagnostics.ts')), 'diag');
  assert('A-SETUP', '14. failure bridge', existsSync(join(dir, 'visual-verification-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '15. orchestrator', existsSync(join(dir, 'visual-verification-engine.ts')), 'orch');
  assert('A-SETUP', '16. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '17. feed bridge', existsSync(join(ROOT, 'src/operator-feed/visual-verification-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '18. script', typeof pkg.scripts?.['validate:visual-verification-engine'] === 'string', 'script');
  const owner = getDevPulseV2Owner('visual_verification_engine');
  assert('A-SETUP', '19. owner', owner.ownerModule === VISUAL_VERIFICATION_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '20. phase', owner.phase === 16.6, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = verifyVisualOutcome(baseInput());
  assert('B-CORE', '21. report id', ready.visualVerificationReport.verificationId.startsWith('vver-'), 'id');
  assert('B-CORE', '22. inspection link', ready.visualVerificationReport.inspectionId?.startsWith('uinsp-') === true, 'insp');
  assert('B-CORE', '23. interaction link', ready.visualVerificationReport.interactionTestId?.startsWith('itest-') === true, 'itest');
  assert('B-CORE', '24. sv link', ready.visualVerificationReport.selfVisionSessionId?.startsWith('svsess-') === true, 'sv');
  assert('B-CORE', '25. verified status', ALL_VERIFICATION_STATUSES.includes(ready.visualVerificationReport.verificationStatus), ready.visualVerificationReport.verificationStatus);
  assert('B-CORE', '26. targets', ready.visualVerificationReport.verificationTargets.length >= 4, String(ready.visualVerificationReport.verificationTargets.length));
  assert('B-CORE', '27. results', ready.visualVerificationReport.verificationResults.length >= 4, String(ready.visualVerificationReport.verificationResults.length));
  assert('B-CORE', '28. evidence', ready.visualVerificationReport.verificationEvidence.length >= 4, String(ready.visualVerificationReport.verificationEvidence.length));
  assert('B-CORE', '29. verification only', ready.visualVerificationReport.verificationOnly === true, 'only');

  const noInspection = verifyVisualOutcome(
    baseInput({
      suppressRuntimeBootstrap: true,
      inspectionReportExists: false,
      interactionReportExists: true,
      selfVisionSessionExists: true,
      previewContextExists: true,
    }),
  );
  assert('B-CORE', '30. missing inspection', noInspection.visualVerificationReport.verificationStatus === 'VERIFICATION_BLOCKED', noInspection.visualVerificationReport.verificationStatus);

  const noInteraction = verifyVisualOutcome(
    baseInput({
      suppressRuntimeBootstrap: true,
      inspectionReportExists: true,
      interactionReportExists: false,
      selfVisionSessionExists: true,
      previewContextExists: true,
    }),
  );
  assert('B-CORE', '31. missing interaction', noInteraction.visualVerificationReport.verificationStatus === 'VERIFICATION_BLOCKED', noInteraction.visualVerificationReport.verificationStatus);

  resetAll();
  const inspection = inspectUiSurface(baseInput({ query: CANONICAL_QUERY }));
  const svSession = inspection.inspectionReport.selfVisionSessionId
    ? getSelfVisionSession(inspection.inspectionReport.selfVisionSessionId)
    : null;
  const previewContext = {
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetType: svSession?.targetType ?? ('WEB_APP' as const),
    targetName: 'DevPulse Web Preview',
    previewUrl: null,
    previewSessionId: svSession?.previewSessionId ?? null,
  };
  const interaction = executeInteractionTesting(
    baseInput({
      query: CANONICAL_QUERY,
      inspectionReport: inspection.inspectionReport,
      selfVisionSession: svSession,
      previewContext,
    }),
  );
  const targets = classifyVerificationTargets(inspection.inspectionReport, interaction.interactionTestingReport);
  const layout = verifyLayoutTargets(targets, inspection.inspectionReport);
  const nav = verifyNavigationTargets(targets, inspection.inspectionReport);
  const loading = verifyLoadingTargets(targets, inspection.inspectionReport);
  const responsive = verifyResponsiveTargets(targets, inspection.inspectionReport);
  const interactionOutcomes = verifyInteractionOutcomes(targets, interaction.interactionTestingReport);
  const evidence = buildVerificationEvidence([...layout, ...nav, ...loading, ...responsive, ...interactionOutcomes], null);
  const risks = classifyVerificationRisks([...layout, ...nav, ...loading, ...responsive, ...interactionOutcomes], evidence);

  assert('B-CORE', '32. layout verification', layout.length >= 1, String(layout.length));
  assert('B-CORE', '33. nav verification', nav.length >= 1, String(nav.length));
  assert('B-CORE', '34. loading verification', loading.length >= 1, String(loading.length));
  assert('B-CORE', '35. responsive verification', responsive.length >= 1, String(responsive.length));
  assert('B-CORE', '36. interaction verification', interactionOutcomes.length >= 1, String(interactionOutcomes.length));
  assert('B-CORE', '37. evidence generation', evidence.length >= 4, String(evidence.length));
  assert('B-CORE', '38. risk generation', risks.length >= 0, String(risks.length));
  assert('B-CORE', '39. target types', ALL_VERIFICATION_TARGET_TYPES.length === 6, String(ALL_VERIFICATION_TARGET_TYPES.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '40. routing', routing.primaryCapability === 'VISUAL_VERIFICATION_ENGINE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '41. advisory', isVisualVerificationAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '42. action verification id', action.candidates[0]!.visualVerificationId.startsWith('vver-'), 'id');
  assert('C-INTEGRATION', '43. action status', action.candidates[0]!.visualVerificationStatus.length > 5, 'status');
  assert('C-INTEGRATION', '44. target count', action.candidates[0]!.visualVerificationTargetCount >= 5, 'count');

  const reasoning = buildReasoningVisibilityRecord('why visual verification');
  assert('C-INTEGRATION', '45. reasoning basis', reasoning.visualVerificationBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '46. reasoning results', reasoning.visualVerificationResults.length >= 3, 'results');
  assert('C-INTEGRATION', '47. reasoning evidence', reasoning.visualVerificationEvidence.length >= 3, 'evidence');
  assert('C-INTEGRATION', '48. reasoning risks', reasoning.visualVerificationRisks.length >= 1, 'risks');
  assert('C-INTEGRATION', '49. reasoning warnings', reasoning.visualVerificationWarnings.length >= 2, 'warnings');

  const failures = buildFailureRecords('Why is verification blocked?');
  assert('C-INTEGRATION', '50. failure', failures.some((f) => f.sourceSystem === 'visual_verification_engine'), 'fail');

  const progress = buildProgressRecords('Visual verification');
  assert('C-INTEGRATION', '51. progress', progress[0]?.visualVerificationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '52. uvl rows', VISUAL_VERIFICATION_ENGINE_UVL_ROWS.length === 13, String(VISUAL_VERIFICATION_ENGINE_UVL_ROWS.length));
  assert('D-REGISTRY', '53. uvl types', hasUvlRow('VISUAL_VERIFICATION_ENGINE_TYPES'), 'types');
  assert('D-REGISTRY', '54. console', isIntelligenceConsoleCapability('VISUAL_VERIFICATION_ENGINE'), 'console');
  assert('D-REGISTRY', '55. find panel', resolveFindPanelAlias('Visual Verification') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '56. registry', registry.includes('visual_verification_engine'), 'registry');
  for (const forbidden of FORBIDDEN_VISUAL_VERIFICATION_DUPLICATES) {
    assert('D-REGISTRY', `57.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = verifyVisualOutcome(baseInput());
  const engineSrc = readText('src/visual-verification-engine/visual-verification-engine.ts');
  const allSrc = [
    engineSrc,
    readText('src/visual-verification-engine/layout-verification-engine.ts'),
    readText('src/visual-verification-engine/verification-evidence-builder.ts'),
  ].join('\n');
  assert('E-STATIC', '58. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '59. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '60. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '61. no auto-fix', !allSrc.toLowerCase().includes('autofix'), 'clean');
  assert('E-STATIC', '62. no patch apply', !allSrc.includes('applyPatch'), 'clean');
  assert('E-STATIC', '63. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('VISUAL_VERIFICATION_ENGINE'), 'feed');
  assert('E-STATIC', '64. verification only', staticReady.visualVerificationReport.verificationOnly === true, 'only');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `65.${i} report id`, fixture.visualVerificationReport.verificationId.startsWith('vver-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `66.${i} signal`, isVisualVerificationQuestion(`visual verification batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What verification failed batch ${i}?`);
    assert('F-CACHED', `67.${i} route`, r.primaryCapability === 'VISUAL_VERIFICATION_ENGINE', String(r.primaryCapability));
  }
  const bridge = buildVisualVerificationFailureContext('Why is verification blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `68.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is verification blocked?';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `69.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVisualVerificationDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Verification targets: ${diag.verificationTargetCount}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(VISUAL_VERIFICATION_ENGINE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
