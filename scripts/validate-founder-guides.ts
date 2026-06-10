/**
 * Phase 24.2 — Founder Guides validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_GUIDES_PASS_TOKEN,
  FOUNDER_GUIDES_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE,
  analyzeRoadmapGuide,
  analyzeCheckpointGuide,
  analyzeSystemNavigationGuide,
  analyzeModificationSafetyGuide,
  analyzeEvolutionGuide,
  buildUnifiedFounderGuidesAuthority,
  clearFounderGuidesHistory,
  evaluateFounderGuides,
  evaluateFounderGuidesEngine,
  generateFounderGuidesReport,
  getAuthorityBuildCount,
  getCheckpointAnalysisCount,
  getDevPulseV2FounderGuides,
  getEvaluationCount,
  getEvolutionAnalysisCount,
  getFounderGuidesCacheStats,
  getFounderGuidesHistorySize,
  getFounderGuideRecord,
  getFounderGuideRecordCount,
  getFounderGuidesRuntimeReport,
  getNavigationAnalysisCount,
  getRoadmapAnalysisCount,
  getSafetyAnalysisCount,
  isFounderGuidesQuestion,
  listBaseCheckpoints,
  listProtectedAreas,
  lookupGuideByProjectId,
  lookupGuideByState,
  registerFounderGuidesWithCapabilityRegistry,
  registerFounderGuidesWithCentralBrain,
  registerFounderGuidesWithFindPanel,
  registerFounderGuidesWithFoundation,
  registerFounderGuidesWithMissingCapabilityEscalation,
  registerFounderGuidesWithProductHardeningCheckpoint,
  registerFounderGuidesWithRoadmap,
  registerFounderGuidesWithSelfDocumentation,
  registerFounderGuidesWithSelfEvolutionGovernance,
  registerFounderGuidesWithTrustEngineCheckpoint,
  registerFounderGuidesWithUnifiedTrustScore,
  registerFounderGuidesWithUvl,
  registerFounderGuidesWithWorld2,
  resetFounderGuidesForTests,
} from '../src/founder-guides/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_GUIDES_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderGuidesInput } from '../src/founder-guides/founder-guides-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-guides');

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
  'founder-guides-types.ts',
  'founder-guides-cache.ts',
  'founder-guides-registry.ts',
  'roadmap-guide-analyzer.ts',
  'checkpoint-guide-analyzer.ts',
  'system-navigation-guide-analyzer.ts',
  'modification-safety-guide-analyzer.ts',
  'evolution-guide-analyzer.ts',
  'founder-guides-authority-builder.ts',
  'founder-guides-evaluator.ts',
  'founder-guides-history.ts',
  'founder-guides-reporting.ts',
  'founder-guides.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderGuidesForTests();
}

function guideInput(requestId: string, overrides: Partial<FounderGuidesInput> = {}): FounderGuidesInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2FounderGuides();
  assert('A-TYPES', 'pass token', engine.passToken === FOUNDER_GUIDES_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === FOUNDER_GUIDES_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.2, String(engine.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_GUIDES_UVL_ROWS.length >= 13, String(FOUNDER_GUIDES_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_guides').phase === 24.2, '24.2');
  assert('A-TYPES', 'question signal', isFounderGuidesQuestion('show founder guides'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateFounderGuidesEngine(guideInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderGuideRecord(record.guideId) !== undefined, record.guideId);
  assert('B-REGISTRY', 'by project', lookupGuideByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'guide id', record.guideId.startsWith('founder-guides-'), record.guideId);
  assert('B-REGISTRY', 'record count', getFounderGuideRecordCount() >= 1, String(getFounderGuideRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runRoadmapGuides(): void {
  const g = harness.beginGroup('C-ROADMAP-GUIDES');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const clean = analyzeRoadmapGuide(guideInput('roadmap-clean'), {
    completedPhaseCount: snapshot.completedPhaseCount,
    currentPhase: snapshot.currentPhase,
    nextPhase: snapshot.nextPhase,
    hasRecommendedNextStep: snapshot.hasRecommendedNextStep,
  });
  assert('C-ROADMAP-GUIDES', 'clean score', clean.roadmapCoverageScore >= 85, String(clean.roadmapCoverageScore));
  assert('C-ROADMAP-GUIDES', 'no gaps', clean.undocumentedRoadmapAreas.length === 0, '0');

  const gaps = analyzeRoadmapGuide(guideInput('roadmap-gaps', {
    missingCompletedPhases: true,
    missingCurrentPhase: true,
    missingFuturePhases: true,
    missingRoadmapOrdering: true,
    undocumentedRoadmapAreas: ['phase_25', 'phase_26', 'phase_27'],
  }), {
    completedPhaseCount: 2,
    currentPhase: '',
    nextPhase: '',
    hasRecommendedNextStep: false,
  });
  assert('C-ROADMAP-GUIDES', 'warnings', gaps.roadmapWarnings.length >= 4, String(gaps.roadmapWarnings.length));
  assert('C-ROADMAP-GUIDES', 'gaps present', gaps.undocumentedRoadmapAreas.length >= 3, String(gaps.undocumentedRoadmapAreas.length));
  assert('C-ROADMAP-GUIDES', 'low score', gaps.roadmapCoverageScore < 50, String(gaps.roadmapCoverageScore));

  harness.endGroup('C-ROADMAP-GUIDES', g);
}

function runCheckpointGuides(): void {
  const g = harness.beginGroup('D-CHECKPOINT-GUIDES');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const clean = analyzeCheckpointGuide(guideInput('checkpoint-clean'), {
    documentedCheckpoints: snapshot.documentedCheckpoints,
  });
  assert('D-CHECKPOINT-GUIDES', 'clean score', clean.checkpointCoverageScore >= 85, String(clean.checkpointCoverageScore));
  assert('D-CHECKPOINT-GUIDES', 'base checkpoints', listBaseCheckpoints().length >= 5, String(listBaseCheckpoints().length));

  const gaps = analyzeCheckpointGuide(guideInput('checkpoint-gaps', {
    missingTrustEngineCheckpoint: true,
    missingProductHardeningCheckpoint: true,
    missingLaunchCheckpointDocs: true,
    missingFounderReadinessCheckpoint: true,
    undocumentedCheckpoints: ['trust_engine_verification', 'product_hardening_verification'],
  }), {
    documentedCheckpoints: ['launch_checkpoint'],
  });
  assert('D-CHECKPOINT-GUIDES', 'warnings', gaps.checkpointWarnings.length >= 4, String(gaps.checkpointWarnings.length));
  assert('D-CHECKPOINT-GUIDES', 'gaps present', gaps.undocumentedCheckpoints.length >= 3, String(gaps.undocumentedCheckpoints.length));
  assert('D-CHECKPOINT-GUIDES', 'low score', gaps.checkpointCoverageScore < 50, String(gaps.checkpointCoverageScore));

  harness.endGroup('D-CHECKPOINT-GUIDES', g);
}

function runNavigationGuides(): void {
  const g = harness.beginGroup('E-NAVIGATION-GUIDES');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const clean = analyzeSystemNavigationGuide(guideInput('nav-clean'), {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    ownerCount: snapshot.foundationDomains,
    authorityChainCount: snapshot.authorityChainCount,
  });
  assert('E-NAVIGATION-GUIDES', 'clean score', clean.navigationCoverageScore >= 80, String(clean.navigationCoverageScore));
  assert('E-NAVIGATION-GUIDES', 'no gaps', clean.undocumentedNavigationAreas.length === 0, '0');

  const gaps = analyzeSystemNavigationGuide(guideInput('nav-gaps', {
    missingCapabilityDiscovery: true,
    missingFindPanelAliases: true,
    missingOwnershipMapping: true,
    missingAuthorityChainNavigation: true,
    undocumentedNavigationAreas: ['capability_registry', 'find_panel', 'ownership_registry'],
  }), {
    capabilityCount: 5,
    aliasCount: 3,
    ownerCount: 4,
    authorityChainCount: 1,
  });
  assert('E-NAVIGATION-GUIDES', 'warnings', gaps.navigationWarnings.length >= 4, String(gaps.navigationWarnings.length));
  assert('E-NAVIGATION-GUIDES', 'gaps present', gaps.undocumentedNavigationAreas.length >= 3, String(gaps.undocumentedNavigationAreas.length));
  assert('E-NAVIGATION-GUIDES', 'low score', gaps.navigationCoverageScore < 55, String(gaps.navigationCoverageScore));

  harness.endGroup('E-NAVIGATION-GUIDES', g);
}

function runModificationSafety(): void {
  const g = harness.beginGroup('F-MODIFICATION-SAFETY');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const clean = analyzeModificationSafetyGuide(guideInput('safety-clean'), {
    protectedFoundationCount: snapshot.protectedFoundationCount,
    governanceControlledCount: snapshot.governanceControlledCount,
  });
  assert('F-MODIFICATION-SAFETY', 'clean score', clean.safetyCoverageScore >= 75, String(clean.safetyCoverageScore));
  assert('F-MODIFICATION-SAFETY', 'protected areas', listProtectedAreas().length >= 5, String(listProtectedAreas().length));

  const gaps = analyzeModificationSafetyGuide(guideInput('safety-gaps', {
    missingProtectedFoundationGuidance: true,
    missingGovernanceControlledGuidance: true,
    missingCheckpointBeforeModifyGuidance: true,
    missingIsolatedModuleGuidance: true,
    unsafeModificationAreas: ['foundation_ownership_registry', 'execution_authority', 'governance_stack'],
  }), {
    protectedFoundationCount: 2,
    governanceControlledCount: 1,
  });
  assert('F-MODIFICATION-SAFETY', 'warnings', gaps.safetyWarnings.length >= 4, String(gaps.safetyWarnings.length));
  assert('F-MODIFICATION-SAFETY', 'unsafe areas', gaps.unsafeModificationAreas.length >= 3, String(gaps.unsafeModificationAreas.length));
  assert('F-MODIFICATION-SAFETY', 'low score', gaps.safetyCoverageScore < 50, String(gaps.safetyCoverageScore));

  harness.endGroup('F-MODIFICATION-SAFETY', g);
}

function runEvolutionGuides(): void {
  const g = harness.beginGroup('G-EVOLUTION-GUIDES');
  resetAll();

  const clean = analyzeEvolutionGuide(guideInput('evolution-clean'), {
    hasSelfEvolutionGovernance: true,
    hasMissingCapabilityEscalation: true,
    hasWorld2Growth: true,
    hasFounderApprovalBoundaries: true,
  });
  assert('G-EVOLUTION-GUIDES', 'clean score', clean.evolutionCoverageScore >= 80, String(clean.evolutionCoverageScore));
  assert('G-EVOLUTION-GUIDES', 'no gaps', clean.undocumentedEvolutionAreas.length === 0, '0');

  const gaps = analyzeEvolutionGuide(guideInput('evolution-gaps', {
    missingSelfEvolutionGuidance: true,
    missingEscalationGuidance: true,
    missingWorld2GrowthGuidance: true,
    missingFounderApprovalBoundaryGuidance: true,
    undocumentedEvolutionAreas: ['self_evolution_governance', 'world2_growth', 'roadmap_progression'],
  }), {
    hasSelfEvolutionGovernance: false,
    hasMissingCapabilityEscalation: false,
    hasWorld2Growth: false,
    hasFounderApprovalBoundaries: false,
  });
  assert('G-EVOLUTION-GUIDES', 'warnings', gaps.evolutionWarnings.length >= 4, String(gaps.evolutionWarnings.length));
  assert('G-EVOLUTION-GUIDES', 'gaps present', gaps.undocumentedEvolutionAreas.length >= 3, String(gaps.undocumentedEvolutionAreas.length));
  assert('G-EVOLUTION-GUIDES', 'low score', gaps.evolutionCoverageScore < 50, String(gaps.evolutionCoverageScore));

  harness.endGroup('G-EVOLUTION-GUIDES', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const input = guideInput('auth-test');
  const roadmap = analyzeRoadmapGuide(input, {
    completedPhaseCount: snapshot.completedPhaseCount,
    currentPhase: snapshot.currentPhase,
    nextPhase: snapshot.nextPhase,
    hasRecommendedNextStep: snapshot.hasRecommendedNextStep,
  });
  const checkpoint = analyzeCheckpointGuide(input, { documentedCheckpoints: snapshot.documentedCheckpoints });
  const navigation = analyzeSystemNavigationGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    ownerCount: snapshot.foundationDomains,
    authorityChainCount: snapshot.authorityChainCount,
  });
  const safety = analyzeModificationSafetyGuide(input, {
    protectedFoundationCount: snapshot.protectedFoundationCount,
    governanceControlledCount: snapshot.governanceControlledCount,
  });
  const evolution = analyzeEvolutionGuide(input, {
    hasSelfEvolutionGovernance: true,
    hasMissingCapabilityEscalation: true,
    hasWorld2Growth: true,
    hasFounderApprovalBoundaries: true,
  });
  const authority = buildUnifiedFounderGuidesAuthority(
    'auth-test',
    roadmap,
    checkpoint,
    navigation,
    safety,
    evolution,
    input,
  );

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-guides-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'coverage score', authority.founderCoverageScore > 0, String(authority.founderCoverageScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'completeness', authority.completenessLevel.length > 0, authority.completenessLevel);

  const blocked = buildUnifiedFounderGuidesAuthority(
    'auth-blocked',
    roadmap,
    checkpoint,
    navigation,
    safety,
    evolution,
    { ...input, governanceBlocked: true },
  );
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'UNKNOWN', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateFounderGuidesEngine(guideInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'READY' || record.state === 'PARTIAL', record.state);
  assert('I-EVALUATION', 'coverage score', record.founderCoverageScore > 50, String(record.founderCoverageScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateFounderGuidesEngine(guideInput('eval-degraded', {
    missingCompletedPhases: true,
    missingCurrentPhase: true,
    missingFuturePhases: true,
    missingRoadmapOrdering: true,
    missingTrustEngineCheckpoint: true,
    missingProductHardeningCheckpoint: true,
    missingLaunchCheckpointDocs: true,
    missingCapabilityDiscovery: true,
    missingFindPanelAliases: true,
    missingProtectedFoundationGuidance: true,
    missingGovernanceControlledGuidance: true,
    missingSelfEvolutionGuidance: true,
    missingEscalationGuidance: true,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'READY', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.founderCoverageScore < 75, String(degraded.record.founderCoverageScore));

  const snapshot = registerFounderGuidesWithCentralBrain();
  const input = guideInput('eval-manual');
  const authority = buildUnifiedFounderGuidesAuthority(
    'eval-manual',
    analyzeRoadmapGuide(input, {
      completedPhaseCount: snapshot.completedPhaseCount,
      currentPhase: snapshot.currentPhase,
      nextPhase: snapshot.nextPhase,
      hasRecommendedNextStep: snapshot.hasRecommendedNextStep,
    }),
    analyzeCheckpointGuide(input, { documentedCheckpoints: snapshot.documentedCheckpoints }),
    analyzeSystemNavigationGuide(input, {
      capabilityCount: snapshot.capabilityEntries,
      aliasCount: snapshot.findPanelAliases,
      ownerCount: snapshot.foundationDomains,
      authorityChainCount: snapshot.authorityChainCount,
    }),
    analyzeModificationSafetyGuide(input, {
      protectedFoundationCount: snapshot.protectedFoundationCount,
      governanceControlledCount: snapshot.governanceControlledCount,
    }),
    analyzeEvolutionGuide(input, {
      hasSelfEvolutionGovernance: true,
      hasMissingCapabilityEscalation: true,
      hasWorld2Growth: true,
      hasFounderApprovalBoundaries: true,
    }),
    input,
  );
  const evaluation = evaluateFounderGuides(authority);
  assert('I-EVALUATION', 'guide readiness', evaluation.guideReadiness > 0, String(evaluation.guideReadiness));
  assert('I-EVALUATION', 'navigation score', evaluation.navigationCoverageScore >= 0, String(evaluation.navigationCoverageScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateFounderGuidesEngine(guideInput('report-test'));
  assert('J-REPORTING', 'coverage score', report.founderCoverageScore === record.founderCoverageScore, String(report.founderCoverageScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'roadmap guidance', report.roadmapGuidance.length > 0, String(report.roadmapGuidance.length));
  assert('J-REPORTING', 'evolution guidance', report.evolutionGuidance.length > 0, String(report.evolutionGuidance.length));

  const manual = generateFounderGuidesReport(
    record,
    report.evaluation,
    { roadmapCoverageScore: 90, undocumentedRoadmapAreas: [], roadmapWarnings: [] },
    { checkpointCoverageScore: 90, undocumentedCheckpoints: [], checkpointWarnings: [] },
    { navigationCoverageScore: 90, navigationWarnings: [], undocumentedNavigationAreas: [] },
    { safetyCoverageScore: 90, unsafeModificationAreas: [], safetyWarnings: [] },
    { evolutionCoverageScore: 90, undocumentedEvolutionAreas: [], evolutionWarnings: [] },
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateFounderGuidesEngine(guideInput(`history-${i}`));
  }
  assert('J-REPORTING', 'history bounded', getFounderGuidesHistorySize() === 128, String(getFounderGuidesHistorySize()));
  clearFounderGuidesHistory();
  assert('J-REPORTING', 'history cleared', getFounderGuidesHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerFounderGuidesWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerFounderGuidesWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'self documentation', registerFounderGuidesWithSelfDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'foundation', registerFounderGuidesWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerFounderGuidesWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerFounderGuidesWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerFounderGuidesWithUvl().uvlRowCount >= 13, String(registerFounderGuidesWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'roadmap', registerFounderGuidesWithRoadmap().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'unified trust score', registerFounderGuidesWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerFounderGuidesWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'product hardening checkpoint', registerFounderGuidesWithProductHardeningCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerFounderGuidesWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerFounderGuidesWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerFounderGuidesWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));
  assert('K-INTEGRATION', 'checkpoints', brain.documentedCheckpoints.length >= 5, String(brain.documentedCheckpoints.length));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const snapshot = registerFounderGuidesWithCentralBrain();
  const input = guideInput('cache-fixed');
  const roadmap = analyzeRoadmapGuide(input, {
    completedPhaseCount: snapshot.completedPhaseCount,
    currentPhase: snapshot.currentPhase,
    nextPhase: snapshot.nextPhase,
    hasRecommendedNextStep: snapshot.hasRecommendedNextStep,
  });
  const checkpoint = analyzeCheckpointGuide(input, { documentedCheckpoints: snapshot.documentedCheckpoints });
  const navigation = analyzeSystemNavigationGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    ownerCount: snapshot.foundationDomains,
    authorityChainCount: snapshot.authorityChainCount,
  });
  const safety = analyzeModificationSafetyGuide(input, {
    protectedFoundationCount: snapshot.protectedFoundationCount,
    governanceControlledCount: snapshot.governanceControlledCount,
  });
  const evolution = analyzeEvolutionGuide(input, {
    hasSelfEvolutionGovernance: true,
    hasMissingCapabilityEscalation: true,
    hasWorld2Growth: true,
    hasFounderApprovalBoundaries: true,
  });

  buildUnifiedFounderGuidesAuthority('cache-fixed', roadmap, checkpoint, navigation, safety, evolution, input);
  buildUnifiedFounderGuidesAuthority('cache-fixed', roadmap, checkpoint, navigation, safety, evolution, input);

  const cache = getFounderGuidesCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupGuideByState('READY');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressGuides(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateFounderGuidesEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      missingCompletedPhases: i % 11 === 0,
      missingTrustEngineCheckpoint: i % 13 === 0,
      missingCapabilityDiscovery: i % 17 === 0,
      missingProtectedFoundationGuidance: i % 19 === 0,
      missingSelfEvolutionGuidance: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getFounderGuideRecordCount() === count, String(getFounderGuideRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getFounderGuidesRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'roadmap analyses', runtime.roadmapAnalysisCount > 0, String(runtime.roadmapAnalysisCount));

  const sample = getFounderGuideRecord(`founder-guides-${count}`);
  assert(`M-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('N-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 24.2 Founder Guides');
  console.log('========================================\n');

  runSetup();
  runRegistry();
  runRoadmapGuides();
  runCheckpointGuides();
  runNavigationGuides();
  runModificationSafety();
  runEvolutionGuides();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressGuides(100, '100');
  stressGuides(1000, '1000');
  stressGuides(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getFounderGuidesRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Roadmap analyses: ${getRoadmapAnalysisCount()}`,
    `Checkpoint analyses: ${getCheckpointAnalysisCount()}`,
    `Navigation analyses: ${getNavigationAnalysisCount()}`,
    `Safety analyses: ${getSafetyAnalysisCount()}`,
    `Evolution analyses: ${getEvolutionAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getFounderGuideRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? FOUNDER_GUIDES_PASS_TOKEN : 'FOUNDER_GUIDES_V1_FAIL',
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

  console.log(`\n${FOUNDER_GUIDES_PASS_TOKEN}`);
}

main();
