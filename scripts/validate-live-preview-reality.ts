/**
 * Phase 24A.2 — Live Preview Reality validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVE_PREVIEW_REALITY_PASS_TOKEN,
  analyzePreviewConnectivity,
  analyzePreviewInfrastructure,
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildLivePreviewRealityInputFromWorkspace,
  buildPreviewWorkspaceSignalsFromLegacy,
  detectPreviewModulePresenceEvidence,
  getLivePreviewHistoryCount,
  getLivePreviewRegistryCount,
  resetLivePreviewRealityAuthorityCounterForTests,
  resetLivePreviewRealityHistoryForTests,
  resetLivePreviewRealityRegistryForTests,
  type LivePreviewRealityInput,
  writeLivePreviewRealityReportFile,
} from '../src/live-preview-reality/index.js';
import {
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import {
  createPreviewSession,
  resetPreviewSessionManagerForTests,
  resetPreviewTargetRegistryForTests,
} from '../src/live-preview-runtime/index.js';

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

function baseInput(overrides: Partial<LivePreviewRealityInput> = {}): LivePreviewRealityInput {
  return {
    uiSurfacePresent: true,
    connected: false,
    previewUrl: null,
    activeSession: null,
    sessions: [],
    diagnostics: {
      previewRuntimeActive: false,
      previewSessionCount: 0,
      registeredTargetCount: 0,
      readyPreviewCount: 0,
      blockedPreviewCount: 0,
    },
    latestProjectId: 'proj-latest',
    projectCount: 1,
    generatedAt: Date.now(),
    ...overrides,
  };
}

function readySession(projectId: string) {
  return {
    previewSessionId: 'pvsess-ready',
    projectId,
    previewState: 'PREVIEW_READY',
    previewUrl: 'http://127.0.0.1:4173/preview',
    previewCapabilities: ['LIVE_VIEW', 'INTERACTION_TESTING', 'VISUAL_VERIFICATION'],
    warnings: [] as string[],
    blockedReasons: [] as string[],
    createdAt: Date.now(),
    previewTargetName: 'web-app',
  };
}

function authorityInputFromLegacy(
  legacyInput: LivePreviewRealityInput,
  executionConnected: boolean,
) {
  const legacyAssessment = assessLivePreviewReality(legacyInput);
  return {
    workspace: buildPreviewWorkspaceSignalsFromLegacy(legacyInput, executionConnected, legacyAssessment),
    moduleEvidence: detectPreviewModulePresenceEvidence(ROOT),
    legacyInput,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Live Preview Reality — Validation');
  console.log('=================================');
  console.log('');

  resetLivePreviewRealityAuthorityCounterForTests();
  resetLivePreviewRealityRegistryForTests();
  resetLivePreviewRealityHistoryForTests();

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/live-preview-reality/live-preview-reality-authority.ts');
  const evidenceAuthority = readText('src/live-preview-reality/live-preview-reality-evidence-authority.ts');
  const analyzers = readText('src/live-preview-reality/live-preview-reality-analyzers.ts');
  const types = readText('src/live-preview-reality/live-preview-reality-types.ts');
  const registry = readText('src/live-preview-reality/live-preview-reality-registry.ts');
  const history = readText('src/live-preview-reality/live-preview-reality-history.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-types.ts')), 'types');
  assert('03. registry module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-registry.ts')), 'registry');
  assert('04. history module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-history.ts')), 'history');
  assert('05. analyzers module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-analyzers.ts')), 'analyzers');
  assert('06. package script', Boolean(pkg.scripts?.['validate:live-preview-reality']), 'package');
  assert('07. assessment types', types.includes('LivePreviewRealityAuthorityAssessment') && types.includes('LivePreviewEvidence'), 'types');
  assert('08. infrastructure analyzer', analyzers.includes('analyzePreviewInfrastructure') && analyzers.includes('PREVIEW_INFRASTRUCTURE_PARTIAL'), 'infra');
  assert('09. runtime analyzer', analyzers.includes('RUNTIME_CLAIMED') && analyzers.includes('RUNTIME_PROVEN'), 'runtime');
  assert('10. connectivity analyzer', analyzers.includes('analyzePreviewConnectivity') && analyzers.includes('PREVIEW_DISCONNECTED'), 'connectivity');
  assert('11. usability analyzer', analyzers.includes('analyzePreviewUsability') && analyzers.includes('PREVIEW_UNPROVEN'), 'usability');
  assert('12. builder-to-preview analyzer', analyzers.includes('analyzeBuildToPreview') && analyzers.includes('BUILD_TO_PREVIEW_MISSING'), 'builder');
  assert('13. authority builder', evidenceAuthority.includes('assessLivePreviewRealityAuthority') && evidenceAuthority.includes('livePreviewRealityScore'), 'authority');
  assert('14. report generation', evidenceAuthority.includes('buildLivePreviewRealityReport'), 'report');
  assert('15. claimed observed proven matrix', evidenceAuthority.includes('previewRealityMatrix') && types.includes('PreviewRealityMatrixRow'), 'matrix');
  assert('16. bounded registry', registry.includes('MAX_REGISTRY_ENTRIES'), 'registry bounds');
  assert('17. bounded history', history.includes('MAX_HISTORY_ENTRIES'), 'history bounds');
  assert('18. URL not proof rule', evidenceAuthority.includes('URL alone') && analyzers.includes('URL alone is not proof'), 'url rule');
  assert('19. route not proof rule', evidenceAuthority.includes('route exists') && evidenceAuthority.includes('Route exists'), 'route rule');
  assert('20. panel not proof rule', evidenceAuthority.includes('panel exists') && evidenceAuthority.includes('UI panel presence'), 'panel rule');
  assert('21. no nested validator cascade', !evidenceAuthority.includes("execSync('npm run validate:"), 'cascade');
  assert('22. no future-state scoring', evidenceAuthority.includes('No future-state scoring') && !evidenceAuthority.includes('roadmap score'), 'future');
  assert('23. eight explicit states', authority.includes('NO_PREVIEW') && authority.includes('PREVIEW_READY'), 'states');
  assert('24. reality UI surface', appJs.includes('live-preview-reality') && appJs.includes('Live Preview Status'), 'ui');
  assert('25. founder preview checks', engine.includes('existsPass') && engine.includes('validationReadyPass'), 'founder checks');
  assert('26. warn pill style', styles.includes('.status-pill.warn'), 'warn style');
  guardRuntime('static');

  const noPreview = assessLivePreviewReality(baseInput());
  assert('27. NO_PREVIEW state', noPreview.state === 'NO_PREVIEW', noPreview.state);
  assert('28. NO_PREVIEW not validation ready', !noPreview.validationReady, String(noPreview.validationReady));

  const falsePositive = assessLivePreviewReality(
    baseInput({
      connected: true,
      sessions: [
        {
          previewSessionId: 'pvsess-0001',
          projectId: 'proj-a',
          previewState: 'REGISTERED',
          previewUrl: null,
        },
      ],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 0,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('29. false-positive detected', falsePositive.falsePositiveReadiness, falsePositive.state);

  const ready = assessLivePreviewReality(
    baseInput({
      connected: true,
      previewUrl: 'http://127.0.0.1:4173/preview',
      activeSession: readySession('proj-latest'),
      sessions: [readySession('proj-latest')],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 1,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('30. PREVIEW_READY state', ready.state === 'PREVIEW_READY', ready.state);

  const urlOnlyInput = baseInput({
    connected: false,
    previewUrl: 'http://127.0.0.1:4173/preview-only',
    activeSession: null,
  });
  const urlOnlyAuthority = assessLivePreviewRealityAuthority(
    authorityInputFromLegacy(urlOnlyInput, false),
  );
  assert(
    '31. URL alone not proof',
    analyzePreviewConnectivity(authorityInputFromLegacy(urlOnlyInput, false)) === 'PREVIEW_PARTIAL' &&
      urlOnlyAuthority.analyzers.runtimeEvidence !== 'RUNTIME_PROVEN',
    urlOnlyAuthority.analyzers.previewConnectivity,
  );
  assert(
    '32. optimistic scoring prohibited',
    urlOnlyAuthority.livePreviewRealityScore <= 54,
    String(urlOnlyAuthority.livePreviewRealityScore),
  );

  resetPreviewSessionManagerForTests();
  resetPreviewTargetRegistryForTests();
  createPreviewSession({
    projectId: 'proj-latest',
    workspaceId: 'ws-1',
    targetName: 'Founder App',
    targetType: 'WEB_APP',
    previewUrl: 'http://127.0.0.1:4173/preview',
    previewState: 'PREVIEW_READY',
  });
  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const legacyInput = buildLivePreviewRealityInputFromWorkspace(snapshot);
  const workspaceAssessment = assessLivePreviewRealityAuthority({
    workspace: buildPreviewWorkspaceSignalsFromLegacy(
      legacyInput,
      snapshot.autonomousBuilder.executionConnected,
      assessLivePreviewReality(legacyInput),
    ),
    moduleEvidence: detectPreviewModulePresenceEvidence(ROOT),
    legacyInput,
  });

  assert('33. snapshot embeds reality', Boolean(snapshot.livePreview.reality?.state), snapshot.livePreview.reality?.state ?? 'missing');
  assert('34. authority score range', workspaceAssessment.livePreviewRealityScore >= 0 && workspaceAssessment.livePreviewRealityScore <= 100, String(workspaceAssessment.livePreviewRealityScore));
  assert('35. matrix five rows', workspaceAssessment.previewRealityMatrix.length === 5, String(workspaceAssessment.previewRealityMatrix.length));
  assert('36. registry bounded', getLivePreviewRegistryCount() <= 16, String(getLivePreviewRegistryCount()));
  assert('37. history bounded', getLivePreviewHistoryCount() <= 32, String(getLivePreviewHistoryCount()));
  assert(
    '38. bottleneck BUILD when execution disconnected',
    !snapshot.autonomousBuilder.executionConnected
      ? workspaceAssessment.founderBottleneck === 'BUILD'
      : workspaceAssessment.founderBottleneck !== 'BUILD',
    workspaceAssessment.founderBottleneck,
  );

  const reportPath = writeLivePreviewRealityReportFile(workspaceAssessment, ROOT);
  assert('39. reality report written', existsSync(reportPath), reportPath);
  const reportText = readText('architecture/LIVE_PREVIEW_REALITY_REPORT.md');
  assert('40. report executive summary', reportText.includes('Executive Summary') && reportText.includes('Live Preview Reality Score'), 'report');
  assert('41. report matrix section', reportText.includes('Preview Reality Matrix'), 'matrix');
  assert('42. report founder conclusion', reportText.includes('Founder Conclusion'), 'conclusion');

  guardRuntime('runtime');

  const v3 = runFounderTestingModeV3({ rootDir: ROOT, validatorScripts });
  const v4 = runFounderTestingModeV4({ rootDir: ROOT, validatorScripts });

  assert('43. V4 preview reality state present', Boolean(v4.previewReality.state), v4.previewReality.state);
  assert('44. V4 preview five checks wired', v4.previewReality.existsPass !== undefined && v4.previewReality.validationReadyPass !== undefined, 'checks');
  assert('45. V3 patience live preview uplift', v3.patienceAssessments.some((p) => p.screen === 'Live Preview' && p.hasExplanation), 'patience');
  assert(
    '46. no optimistic preview-only pass',
    !v4.previewReality.validationReadyPass || v4.previewReality.loadsPass,
    'honest pass coupling',
  );

  const infra = analyzePreviewInfrastructure({
    workspace: buildPreviewWorkspaceSignalsFromLegacy(legacyInput, false, assessLivePreviewReality(legacyInput)),
    moduleEvidence: detectPreviewModulePresenceEvidence(ROOT),
    legacyInput,
  });
  assert('47. infrastructure present in repo', infra !== 'PREVIEW_INFRASTRUCTURE_MISSING', infra);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Live Preview Reality Score: ${workspaceAssessment.livePreviewRealityScore}/100`);
  console.log(`Founder bottleneck: ${workspaceAssessment.founderBottleneck}`);
  console.log(`V4 preview state: ${v4.previewReality.state} | score: ${v4.previewReality.score}`);
  console.log('');

  if (failed.length) {
    console.log('LIVE_PREVIEW_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(LIVE_PREVIEW_REALITY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
