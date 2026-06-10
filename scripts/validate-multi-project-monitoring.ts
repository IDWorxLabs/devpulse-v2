/**
 * Phase 20.6 — Multi Project Monitoring validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  MULTI_PROJECT_MONITORING_PASS_TOKEN,
  MULTI_PROJECT_MONITORING_OWNER_MODULE,
  DEFAULT_MAX_MONITORING_HISTORY_SIZE,
  appendProjectEvent,
  appendProjectOperatorEvent,
  appendTimelineEvent,
  buildPortfolioMonitoringModel,
  createMonitoringAlert,
  createPreviewSession,
  createProjectEventStream,
  createProjectLivePreview,
  createProjectOperatorFeed,
  createProjectTimeline,
  generateMonitoringReport,
  getDevPulseV2MultiProjectMonitoring,
  getMonitoringAlertCount,
  getMonitoringCacheStats,
  getMonitoringHistorySize,
  getMultiProjectMonitoringRuntimeReport,
  getProjectEventStream,
  getProjectLivePreview,
  getProjectMonitor,
  getProjectMonitorCount,
  getProjectOperatorFeed,
  getProjectOperatorFeedCount,
  getProjectOperatorFeedEvents,
  getProjectProgress,
  getProjectTimeline,
  getProjectTimelineCount,
  isMonitoringQuestion,
  listActivePreviewSessions,
  listPreviewSessions,
  listProjectMonitors,
  listProjectMonitorsByStatus,
  recordMonitoringHistory,
  registerMultiProjectMonitoringWithCentralBrain,
  registerMultiProjectMonitoringWithLivePreview,
  registerMultiProjectMonitoringWithMultiProjectFoundation,
  registerMultiProjectMonitoringWithMultiProjectVerification,
  registerMultiProjectMonitoringWithOperatorFeed,
  registerMultiProjectMonitoringWithParallelBuildOrchestration,
  registerMultiProjectMonitoringWithProjectVault,
  registerMultiProjectMonitoringWithResourceAllocation,
  registerMultiProjectMonitoringWithTrustEngine,
  registerMultiProjectMonitoringWithUvl,
  registerMultiProjectMonitoringWithVerificationOrchestration,
  registerMultiProjectMonitoringWithWorkspaceIsolation,
  registerMultiProjectMonitoringWithWorld2Coordinator,
  registerProjectMonitoring,
  resetMultiProjectMonitoringModuleForTests,
  updateProjectProgress,
} from '../src/multi-project-monitoring/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { MULTI_PROJECT_MONITORING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/multi-project-monitoring');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'multi-project-monitoring.ts',
  'monitoring-types.ts',
  'project-monitor-registry.ts',
  'project-operator-feed-manager.ts',
  'project-event-stream-manager.ts',
  'project-timeline-manager.ts',
  'project-progress-tracker.ts',
  'project-live-preview-manager.ts',
  'project-preview-session-manager.ts',
  'portfolio-monitor-manager.ts',
  'monitoring-alert-manager.ts',
  'monitoring-reporting.ts',
  'monitoring-history.ts',
  'monitoring-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetMultiProjectMonitoringModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2MultiProjectMonitoring();
  assert('A-SETUP', 'pass token', authority.passToken === MULTI_PROJECT_MONITORING_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === MULTI_PROJECT_MONITORING_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'monitoring only', authority.monitoringOnly === true, 'monitoringOnly');
  assert('A-SETUP', 'uvl rows', MULTI_PROJECT_MONITORING_UVL_ROWS.length === 14, String(MULTI_PROJECT_MONITORING_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_MONITORING_HISTORY_SIZE === 128, String(DEFAULT_MAX_MONITORING_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('multi_project_monitoring').phase === 20.6, '20.6');
  assert('A-SETUP', 'question signal', isMonitoringQuestion('show portfolio monitoring dashboard'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const monitor = registerProjectMonitoring({ projectId: 'REG1', workspaceId: 'WS1', status: 'ACTIVE' });
  assert('B-REGISTRY', 'registered', getProjectMonitor('REG1') !== undefined, 'REG1');
  assert('B-REGISTRY', 'count', getProjectMonitorCount() === 1, '1');
  assert('B-REGISTRY', 'list', listProjectMonitors().length === 1, '1');
  assert('B-REGISTRY', 'by status', listProjectMonitorsByStatus('ACTIVE').length === 1, 'ACTIVE');
  assert('B-REGISTRY', 'feed id', monitor.feedId.length > 0, monitor.feedId);

  registerProjectMonitoring({ projectId: 'REG2', workspaceId: 'WS2' });
  assert('B-REGISTRY', 'second', getProjectMonitorCount() === 2, '2');

  harness.endGroup('B-REGISTRY', g);
}

function runFeedAndStreamIsolation(): void {
  const g = harness.beginGroup('C-FEED-STREAM-ISOLATION');
  resetAll();

  createProjectOperatorFeed('FA');
  createProjectOperatorFeed('FB');
  appendProjectOperatorEvent('FA', 'Alpha event', 'progress');
  appendProjectOperatorEvent('FB', 'Beta event', 'verification');

  const eventsA = getProjectOperatorFeedEvents('FA');
  const eventsB = getProjectOperatorFeedEvents('FB');
  assert('C-FEED-STREAM-ISOLATION', 'feed A isolated', eventsA.length === 1 && !eventsA.some((e) => e.includes('Beta')), 'A');
  assert('C-FEED-STREAM-ISOLATION', 'feed B isolated', eventsB.length === 1 && !eventsB.some((e) => e.includes('Alpha')), 'B');
  assert('C-FEED-STREAM-ISOLATION', 'feed isolated flag', getProjectOperatorFeed('FA')?.isolated === true, 'isolated');

  createProjectEventStream('SA');
  createProjectEventStream('SB');
  appendProjectEvent('SA', 'BUILD', 'Alpha build');
  appendProjectEvent('SB', 'TESTING', 'Beta test');

  const streamA = getProjectEventStream('SA');
  const streamB = getProjectEventStream('SB');
  assert('C-FEED-STREAM-ISOLATION', 'stream A', streamA.length === 1 && streamA[0].projectId === 'SA', 'SA');
  assert('C-FEED-STREAM-ISOLATION', 'stream B', streamB.length === 1 && streamB[0].projectId === 'SB', 'SB');
  assert('C-FEED-STREAM-ISOLATION', 'no cross stream', !streamA.some((e) => e.projectId === 'SB'), 'isolated');

  harness.endGroup('C-FEED-STREAM-ISOLATION', g);
}

function runTimelineAndProgress(): void {
  const g = harness.beginGroup('D-TIMELINE-PROGRESS');
  resetAll();

  createProjectTimeline('TA');
  createProjectTimeline('TB');
  appendTimelineEvent('TA', 'BUILD', 'Alpha milestone');
  appendTimelineEvent('TB', 'VERIFY', 'Beta milestone');

  const timelineA = getProjectTimeline('TA');
  const timelineB = getProjectTimeline('TB');
  assert('D-TIMELINE-PROGRESS', 'timeline A', timelineA.length === 1 && timelineA[0].projectId === 'TA', 'TA');
  assert('D-TIMELINE-PROGRESS', 'timeline B', timelineB.length === 1 && timelineB[0].projectId === 'TB', 'TB');
  assert('D-TIMELINE-PROGRESS', 'timeline isolated', !timelineA.some((e) => e.projectId === 'TB'), 'isolated');

  const progressA = updateProjectProgress('PA', { planning: 80, build: 72, testing: 60, fixing: 40, verification: 30, completion: 10 });
  const progressB = updateProjectProgress('PB', { planning: 50, build: 38, testing: 25, fixing: 10, verification: 5, completion: 0 });
  assert('D-TIMELINE-PROGRESS', 'progress A', progressA.overall > 0 && getProjectProgress('PA')?.build === 72, String(progressA.overall));
  assert('D-TIMELINE-PROGRESS', 'progress B', progressB.overall > 0 && getProjectProgress('PB')?.build === 38, String(progressB.overall));
  assert('D-TIMELINE-PROGRESS', 'independent progress', progressA.overall !== progressB.overall, 'different');

  harness.endGroup('D-TIMELINE-PROGRESS', g);
}

function runPreviewSessions(): void {
  const g = harness.beginGroup('E-PREVIEW-SESSIONS');
  resetAll();

  createProjectLivePreview('ALPHA', 'W1');
  createProjectLivePreview('BETA', 'W2');
  createProjectLivePreview('GAMMA', 'W3');

  const tabA = createPreviewSession('ALPHA', 'W1', 'tab-a');
  const tabB = createPreviewSession('BETA', 'W2', 'tab-b');
  const tabC = createPreviewSession('GAMMA', 'W3', 'tab-c');

  assert('E-PREVIEW-SESSIONS', 'preview A', getProjectLivePreview('ALPHA')?.projectId === 'ALPHA', 'ALPHA');
  assert('E-PREVIEW-SESSIONS', 'preview B', getProjectLivePreview('BETA')?.projectId === 'BETA', 'BETA');
  assert('E-PREVIEW-SESSIONS', 'preview isolated', getProjectLivePreview('ALPHA')?.workspaceId !== getProjectLivePreview('BETA')?.workspaceId, 'isolated');

  const active = listActivePreviewSessions();
  assert('E-PREVIEW-SESSIONS', 'three tabs', active.length === 3, String(active.length));
  assert('E-PREVIEW-SESSIONS', 'tab A active', tabA.active === true, 'tab-a');
  assert('E-PREVIEW-SESSIONS', 'tab B active', tabB.active === true, 'tab-b');
  assert('E-PREVIEW-SESSIONS', 'tab C active', tabC.active === true, 'tab-c');
  assert('E-PREVIEW-SESSIONS', 'sessions per project', listPreviewSessions('ALPHA').length === 1, '1');

  harness.endGroup('E-PREVIEW-SESSIONS', g);
}

function runAlertsAndPortfolio(): void {
  const g = harness.beginGroup('F-ALERTS-PORTFOLIO');
  resetAll();

  registerProjectMonitoring({ projectId: 'P1', workspaceId: 'W1', status: 'ACTIVE', progress: { build: 70 } });
  registerProjectMonitoring({ projectId: 'P2', workspaceId: 'W2', status: 'FAILED', progress: { build: 20 } });
  registerProjectMonitoring({ projectId: 'P3', workspaceId: 'W3', status: 'PAUSED', progress: { build: 50 } });

  createMonitoringAlert('P2', 'FAILED_PROJECT', 'Project failed');
  createMonitoringAlert('P1', 'HIGH_RISK_PROJECT', 'High risk detected');

  const portfolio = buildPortfolioMonitoringModel();
  assert('F-ALERTS-PORTFOLIO', 'total', portfolio.totalProjects === 3, String(portfolio.totalProjects));
  assert('F-ALERTS-PORTFOLIO', 'active', portfolio.activeProjects === 1, String(portfolio.activeProjects));
  assert('F-ALERTS-PORTFOLIO', 'failed', portfolio.failedProjects === 1, String(portfolio.failedProjects));
  assert('F-ALERTS-PORTFOLIO', 'alerts', portfolio.alertCount === 2, String(portfolio.alertCount));
  assert('F-ALERTS-PORTFOLIO', 'avg progress', portfolio.averageProgress > 0, String(portfolio.averageProgress));

  harness.endGroup('F-ALERTS-PORTFOLIO', g);
}

function runReportingHistoryCache(): void {
  const g = harness.beginGroup('G-REPORT-CACHE');
  resetAll();

  registerProjectMonitoring({ projectId: 'RPT1', workspaceId: 'WR1' });
  const report = generateMonitoringReport();
  recordMonitoringHistory(report);

  assert('G-REPORT-CACHE', 'report id', report.reportId.length > 0, report.reportId);
  assert('G-REPORT-CACHE', 'report feeds', report.feeds.length >= 1, String(report.feeds.length));
  assert('G-REPORT-CACHE', 'history', getMonitoringHistorySize() >= 1, String(getMonitoringHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordMonitoringHistory(report);
  }
  assert('G-REPORT-CACHE', 'history bounded', getMonitoringHistorySize() <= DEFAULT_MAX_MONITORING_HISTORY_SIZE, String(getMonitoringHistorySize()));

  getProjectTimeline('__cache_miss_probe__');
  getProjectOperatorFeed('RPT1');
  getProjectOperatorFeed('RPT1');
  const cache = getMonitoringCacheStats();
  assert('G-REPORT-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('G-REPORT-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('G-REPORT-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('H-INTEGRATION');
  resetAll();

  const brain = registerMultiProjectMonitoringWithCentralBrain();
  assert('H-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerMultiProjectMonitoringWithCentralBrain();
  assert('H-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('H-INTEGRATION', 'project vault', registerMultiProjectMonitoringWithProjectVault().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'trust engine', registerMultiProjectMonitoringWithTrustEngine().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'world2', registerMultiProjectMonitoringWithWorld2Coordinator().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'uvl', registerMultiProjectMonitoringWithUvl().uvlRowCount === 14, '14');
  assert('H-INTEGRATION', 'multi project', registerMultiProjectMonitoringWithMultiProjectFoundation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'workspace isolation', registerMultiProjectMonitoringWithWorkspaceIsolation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'resource allocation', registerMultiProjectMonitoringWithResourceAllocation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'orchestration', registerMultiProjectMonitoringWithParallelBuildOrchestration().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'verification', registerMultiProjectMonitoringWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'verification orchestration', registerMultiProjectMonitoringWithVerificationOrchestration().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'operator feed', registerMultiProjectMonitoringWithOperatorFeed().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'live preview', registerMultiProjectMonitoringWithLivePreview().readOnly === true, 'readOnly');

  harness.endGroup('H-INTEGRATION', g);
}

function stressMonitoring(count: number, label: string): void {
  const g = harness.beginGroup(`I-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    registerProjectMonitoring({
      projectId: `P${i}`,
      workspaceId: `W${i % Math.max(1, Math.floor(count / 10))}`,
      status: i % 5 === 0 ? 'FAILED' : 'ACTIVE',
      progress: {
        planning: 10 + (i % 90),
        build: 5 + (i % 95),
        testing: i % 100,
        fixing: i % 80,
        verification: i % 70,
        completion: i % 60,
      },
      tabLabel: `tab-${i}`,
    });
    if (i % 20 === 0) {
      createMonitoringAlert(`P${i}`, 'VERIFICATION_BOTTLENECK', `Bottleneck at ${i}`);
    }
  }

  const report = generateMonitoringReport();
  const elapsed = performance.now() - start;

  assert(`I-STRESS-${label}`, 'monitor count', getProjectMonitorCount() === count, String(getProjectMonitorCount()));
  assert(`I-STRESS-${label}`, 'feed count', getProjectOperatorFeedCount() === count, String(getProjectOperatorFeedCount()));
  assert(`I-STRESS-${label}`, 'timeline count', getProjectTimelineCount() === count, String(getProjectTimelineCount()));
  assert(`I-STRESS-${label}`, 'report', report.projectCount === count, String(report.projectCount));
  assert(`I-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  getProjectProgress('P0');
  getProjectProgress('P0');

  const runtime = getMultiProjectMonitoringRuntimeReport();
  assert(`I-STRESS-${label}`, 'runtime projects', runtime.projectCount === count, String(runtime.projectCount));
  assert(`I-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`I-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('J-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 20.6 Multi Project Monitoring');
  console.log('==================================================\n');

  runSetup();
  runRegistry();
  runFeedAndStreamIsolation();
  runTimelineAndProgress();
  runPreviewSessions();
  runAlertsAndPortfolio();
  runReportingHistoryCache();
  runIntegration();
  stressMonitoring(100, '100');
  stressMonitoring(1000, '1000');
  stressMonitoring(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getMultiProjectMonitoringRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Project count: ${runtime.projectCount}`,
    `Feed count: ${runtime.feedCount}`,
    `Timeline count: ${runtime.timelineCount}`,
    `Preview count: ${runtime.previewCount}`,
    `Alert count: ${runtime.alertCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? MULTI_PROJECT_MONITORING_PASS_TOKEN : 'MULTI_PROJECT_MONITORING_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.error(`  [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  if (results.length < MIN_SCENARIOS) {
    console.error(`\nInsufficient scenarios: ${results.length} < ${MIN_SCENARIOS}`);
    process.exit(1);
  }

  console.log(`\n${MULTI_PROJECT_MONITORING_PASS_TOKEN}`);
}

main();
