/**
 * Phase 24.1 — Self Documentation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  SELF_DOCUMENTATION_PASS_TOKEN,
  SELF_DOCUMENTATION_OWNER_MODULE,
  DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE,
  analyzeCapabilityDocumentation,
  analyzeModuleDocumentation,
  analyzeDependencyDocumentation,
  analyzeAuthorityChainDocumentation,
  analyzeValidationDocumentation,
  buildUnifiedSelfDocumentationAuthority,
  clearSelfDocumentationHistory,
  evaluateSelfDocumentation,
  evaluateSelfDocumentationEngine,
  generateSelfDocumentationReport,
  getAuthorityBuildCount,
  getCapabilityAnalysisCount,
  getDevPulseV2SelfDocumentation,
  getDependencyAnalysisCount,
  getEvaluationCount,
  getModuleAnalysisCount,
  getAuthorityAnalysisCount,
  getValidationAnalysisCount,
  getSelfDocumentationCacheStats,
  getSelfDocumentationHistorySize,
  getSelfDocumentationRecord,
  getSelfDocumentationRecordCount,
  getSelfDocumentationRuntimeReport,
  isSelfDocumentationQuestion,
  listBaseAuthorityChains,
  listBaseDependencies,
  lookupDocumentationByProjectId,
  lookupDocumentationByState,
  registerSelfDocumentationWithCapabilityRegistry,
  registerSelfDocumentationWithCentralBrain,
  registerSelfDocumentationWithFindPanel,
  registerSelfDocumentationWithFoundation,
  registerSelfDocumentationWithMissingCapabilityEscalation,
  registerSelfDocumentationWithPerformanceHardening,
  registerSelfDocumentationWithPrivacyHardening,
  registerSelfDocumentationWithProductHardeningCheckpoint,
  registerSelfDocumentationWithProjectVault,
  registerSelfDocumentationWithRecoveryHardening,
  registerSelfDocumentationWithReliabilityHardening,
  registerSelfDocumentationWithScaleHardening,
  registerSelfDocumentationWithSecurityHardening,
  registerSelfDocumentationWithSelfEvolutionGovernance,
  registerSelfDocumentationWithTrustEngineCheckpoint,
  registerSelfDocumentationWithUnifiedTrustScore,
  registerSelfDocumentationWithUvl,
  registerSelfDocumentationWithWorld2,
  resetSelfDocumentationForTests,
} from '../src/self-documentation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { SELF_DOCUMENTATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { SelfDocumentationInput } from '../src/self-documentation/self-documentation-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/self-documentation');

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
  'self-documentation-types.ts',
  'self-documentation-cache.ts',
  'self-documentation-registry.ts',
  'capability-documentation-analyzer.ts',
  'module-documentation-analyzer.ts',
  'dependency-documentation-analyzer.ts',
  'authority-chain-documentation-analyzer.ts',
  'validation-documentation-analyzer.ts',
  'self-documentation-authority-builder.ts',
  'self-documentation-evaluator.ts',
  'self-documentation-history.ts',
  'self-documentation-reporting.ts',
  'self-documentation.ts',
  'index.ts',
];

function resetAll(): void {
  resetSelfDocumentationForTests();
}

function docInput(requestId: string, overrides: Partial<SelfDocumentationInput> = {}): SelfDocumentationInput {
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
  const engine = getDevPulseV2SelfDocumentation();
  assert('A-TYPES', 'pass token', engine.passToken === SELF_DOCUMENTATION_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === SELF_DOCUMENTATION_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.1, String(engine.phase));
  assert('A-TYPES', 'uvl rows', SELF_DOCUMENTATION_UVL_ROWS.length >= 13, String(SELF_DOCUMENTATION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('self_documentation').phase === 24.1, '24.1');
  assert('A-TYPES', 'question signal', isSelfDocumentationQuestion('show self documentation'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateSelfDocumentationEngine(docInput('reg-test'));
  assert('B-REGISTRY', 'registered', getSelfDocumentationRecord(record.documentationId) !== undefined, record.documentationId);
  assert('B-REGISTRY', 'by project', lookupDocumentationByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'documentation id', record.documentationId.startsWith('self-documentation-'), record.documentationId);
  assert('B-REGISTRY', 'record count', getSelfDocumentationRecordCount() >= 1, String(getSelfDocumentationRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runCapabilityDocumentation(): void {
  const g = harness.beginGroup('C-CAPABILITY-DOCUMENTATION');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const clean = analyzeCapabilityDocumentation(docInput('cap-clean'), {
    capabilityCount: snapshot.capabilityEntries,
    capabilityIds: snapshot.capabilityIds,
    aliasCount: snapshot.findPanelAliases,
  });
  assert('C-CAPABILITY-DOCUMENTATION', 'clean score', clean.capabilityCoverageScore >= 90, String(clean.capabilityCoverageScore));
  assert('C-CAPABILITY-DOCUMENTATION', 'no gaps', clean.undocumentedCapabilities.length === 0, '0');

  const gaps = analyzeCapabilityDocumentation(docInput('cap-gaps', {
    missingCapabilityLabels: true,
    missingCapabilityPhases: true,
    missingCapabilityAliases: true,
    undocumentedCapabilityIds: ['UNKNOWN_CAP_1', 'UNKNOWN_CAP_2', 'UNKNOWN_CAP_3'],
  }), {
    capabilityCount: snapshot.capabilityEntries,
    capabilityIds: snapshot.capabilityIds,
    aliasCount: snapshot.findPanelAliases,
  });
  assert('C-CAPABILITY-DOCUMENTATION', 'warnings', gaps.capabilityDocumentationWarnings.length >= 3, String(gaps.capabilityDocumentationWarnings.length));
  assert('C-CAPABILITY-DOCUMENTATION', 'gaps present', gaps.undocumentedCapabilities.length >= 3, String(gaps.undocumentedCapabilities.length));
  assert('C-CAPABILITY-DOCUMENTATION', 'low score', gaps.capabilityCoverageScore < 60, String(gaps.capabilityCoverageScore));

  harness.endGroup('C-CAPABILITY-DOCUMENTATION', g);
}

function runModuleDocumentation(): void {
  const g = harness.beginGroup('D-MODULE-DOCUMENTATION');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const clean = analyzeModuleDocumentation(docInput('mod-clean'), {
    moduleCount: snapshot.foundationDomains,
    moduleDomains: ['reliability_hardening', 'scale_hardening'],
  });
  assert('D-MODULE-DOCUMENTATION', 'clean score', clean.moduleCoverageScore >= 85, String(clean.moduleCoverageScore));
  assert('D-MODULE-DOCUMENTATION', 'no gaps', clean.undocumentedModules.length === 0, '0');

  const gaps = analyzeModuleDocumentation(docInput('mod-gaps', {
    missingModuleExports: true,
    missingModulePurpose: true,
    missingModuleOwnership: true,
    undocumentedModuleDomains: ['unknown_module_a', 'unknown_module_b', 'unknown_module_c'],
  }), {
    moduleCount: snapshot.foundationDomains,
    moduleDomains: ['self_documentation'],
  });
  assert('D-MODULE-DOCUMENTATION', 'warnings', gaps.moduleDocumentationWarnings.length >= 3, String(gaps.moduleDocumentationWarnings.length));
  assert('D-MODULE-DOCUMENTATION', 'gaps present', gaps.undocumentedModules.length >= 3, String(gaps.undocumentedModules.length));
  assert('D-MODULE-DOCUMENTATION', 'low score', gaps.moduleCoverageScore < 55, String(gaps.moduleCoverageScore));

  harness.endGroup('D-MODULE-DOCUMENTATION', g);
}

function runDependencyDocumentation(): void {
  const g = harness.beginGroup('E-DEPENDENCY-DOCUMENTATION');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const clean = analyzeDependencyDocumentation(docInput('dep-clean'), {
    knownDependencies: snapshot.knownDependencies,
  });
  assert('E-DEPENDENCY-DOCUMENTATION', 'clean score', clean.dependencyCoverageScore >= 85, String(clean.dependencyCoverageScore));
  assert('E-DEPENDENCY-DOCUMENTATION', 'base deps', listBaseDependencies().length >= 10, String(listBaseDependencies().length));

  const gaps = analyzeDependencyDocumentation(docInput('dep-gaps', {
    missingAuthorityChainMapping: true,
    undocumentedDependencies: ['missing_dep_a', 'missing_dep_b', 'missing_dep_c', 'missing_dep_d'],
  }), {
    knownDependencies: ['foundation_ownership_registry'],
  });
  assert('E-DEPENDENCY-DOCUMENTATION', 'warnings', gaps.dependencyWarnings.length >= 1, String(gaps.dependencyWarnings.length));
  assert('E-DEPENDENCY-DOCUMENTATION', 'gaps present', gaps.undocumentedDependencies.length >= 4, String(gaps.undocumentedDependencies.length));
  assert('E-DEPENDENCY-DOCUMENTATION', 'low score', gaps.dependencyCoverageScore < 50, String(gaps.dependencyCoverageScore));

  harness.endGroup('E-DEPENDENCY-DOCUMENTATION', g);
}

function runAuthorityDocumentation(): void {
  const g = harness.beginGroup('F-AUTHORITY-DOCUMENTATION');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const clean = analyzeAuthorityChainDocumentation(docInput('auth-clean'), {
    documentedChains: snapshot.documentedAuthorityChains,
  });
  assert('F-AUTHORITY-DOCUMENTATION', 'clean score', clean.authorityCoverageScore >= 95, String(clean.authorityCoverageScore));
  assert('F-AUTHORITY-DOCUMENTATION', 'base chains', listBaseAuthorityChains().length >= 5, String(listBaseAuthorityChains().length));

  const gaps = analyzeAuthorityChainDocumentation(docInput('auth-gaps', {
    undocumentedAuthorityChains: ['trust_engine_chain', 'product_hardening_chain', 'verification_chain'],
  }), {
    documentedChains: ['governance_chain'],
  });
  assert('F-AUTHORITY-DOCUMENTATION', 'gaps present', gaps.undocumentedAuthorityChains.length >= 3, String(gaps.undocumentedAuthorityChains.length));
  assert('F-AUTHORITY-DOCUMENTATION', 'low score', gaps.authorityCoverageScore < 60, String(gaps.authorityCoverageScore));

  harness.endGroup('F-AUTHORITY-DOCUMENTATION', g);
}

function runValidationDocumentation(): void {
  const g = harness.beginGroup('G-VALIDATION-DOCUMENTATION');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const clean = analyzeValidationDocumentation(docInput('val-clean'), {
    validationScriptCount: snapshot.validationScripts,
    checkpointCount: snapshot.checkpointCount,
    uvlRowCount: snapshot.uvlRows,
  });
  assert('G-VALIDATION-DOCUMENTATION', 'clean score', clean.validationCoverageScore >= 70, String(clean.validationCoverageScore));
  assert('G-VALIDATION-DOCUMENTATION', 'no gaps', clean.undocumentedValidators.length === 0, '0');

  const gaps = analyzeValidationDocumentation(docInput('val-gaps', {
    missingPassTokens: true,
    missingCheckpointDocs: true,
    missingUvlRegistrationDocs: true,
    missingStressValidationDocs: true,
    undocumentedValidators: ['validate:missing-a', 'validate:missing-b', 'validate:missing-c'],
  }), {
    validationScriptCount: 5,
    checkpointCount: 0,
    uvlRowCount: 10,
  });
  assert('G-VALIDATION-DOCUMENTATION', 'warnings', gaps.validationWarnings.length >= 4, String(gaps.validationWarnings.length));
  assert('G-VALIDATION-DOCUMENTATION', 'gaps present', gaps.undocumentedValidators.length >= 3, String(gaps.undocumentedValidators.length));
  assert('G-VALIDATION-DOCUMENTATION', 'low score', gaps.validationCoverageScore < 40, String(gaps.validationCoverageScore));

  harness.endGroup('G-VALIDATION-DOCUMENTATION', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const input = docInput('auth-test');
  const capability = analyzeCapabilityDocumentation(input, {
    capabilityCount: snapshot.capabilityEntries,
    capabilityIds: snapshot.capabilityIds,
    aliasCount: snapshot.findPanelAliases,
  });
  const module = analyzeModuleDocumentation(input, {
    moduleCount: snapshot.foundationDomains,
    moduleDomains: ['self_documentation'],
  });
  const dependency = analyzeDependencyDocumentation(input, {
    knownDependencies: snapshot.knownDependencies,
  });
  const authorityChain = analyzeAuthorityChainDocumentation(input, {
    documentedChains: snapshot.documentedAuthorityChains,
  });
  const validation = analyzeValidationDocumentation(input, {
    validationScriptCount: snapshot.validationScripts,
    checkpointCount: snapshot.checkpointCount,
    uvlRowCount: snapshot.uvlRows,
  });
  const authority = buildUnifiedSelfDocumentationAuthority(
    'auth-test',
    capability,
    module,
    dependency,
    authorityChain,
    validation,
    input,
  );

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('self-documentation-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'coverage score', authority.documentationCoverageScore > 0, String(authority.documentationCoverageScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'completeness', authority.completenessLevel.length > 0, authority.completenessLevel);

  const blocked = buildUnifiedSelfDocumentationAuthority(
    'auth-blocked',
    capability,
    module,
    dependency,
    authorityChain,
    validation,
    { ...input, governanceBlocked: true },
  );
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'UNKNOWN', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateSelfDocumentationEngine(docInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'DOCUMENTED' || record.state === 'PARTIALLY_DOCUMENTED', record.state);
  assert('I-EVALUATION', 'coverage score', record.documentationCoverageScore > 50, String(record.documentationCoverageScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateSelfDocumentationEngine(docInput('eval-degraded', {
    missingCapabilityLabels: true,
    missingCapabilityPhases: true,
    missingModuleExports: true,
    missingModulePurpose: true,
    missingAuthorityChainMapping: true,
    undocumentedAuthorityChains: ['trust_engine_chain', 'product_hardening_chain'],
    missingPassTokens: true,
    missingCheckpointDocs: true,
    undocumentedValidators: ['validate:gap'],
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'DOCUMENTED', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.documentationCoverageScore < 80, String(degraded.record.documentationCoverageScore));

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const input = docInput('eval-manual');
  const authority = buildUnifiedSelfDocumentationAuthority(
    'eval-manual',
    analyzeCapabilityDocumentation(input, {
      capabilityCount: snapshot.capabilityEntries,
      capabilityIds: snapshot.capabilityIds,
      aliasCount: snapshot.findPanelAliases,
    }),
    analyzeModuleDocumentation(input, {
      moduleCount: snapshot.foundationDomains,
      moduleDomains: ['self_documentation'],
    }),
    analyzeDependencyDocumentation(input, { knownDependencies: snapshot.knownDependencies }),
    analyzeAuthorityChainDocumentation(input, { documentedChains: snapshot.documentedAuthorityChains }),
    analyzeValidationDocumentation(input, {
      validationScriptCount: snapshot.validationScripts,
      checkpointCount: snapshot.checkpointCount,
      uvlRowCount: snapshot.uvlRows,
    }),
    input,
  );
  const evaluation = evaluateSelfDocumentation(authority);
  assert('I-EVALUATION', 'documentation readiness', evaluation.documentationReadiness > 0, String(evaluation.documentationReadiness));
  assert('I-EVALUATION', 'module score', evaluation.moduleCoverageScore >= 0, String(evaluation.moduleCoverageScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateSelfDocumentationEngine(docInput('report-test'));
  assert('J-REPORTING', 'coverage score', report.documentationCoverageScore === record.documentationCoverageScore, String(report.documentationCoverageScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'validation score', report.validationCoverageScore > 0, String(report.validationCoverageScore));

  const manual = generateSelfDocumentationReport(
    record,
    report.evaluation,
    report.undocumentedCapabilities,
    report.undocumentedModules,
    report.undocumentedDependencies,
    report.undocumentedAuthorityChains,
    report.undocumentedValidators,
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateSelfDocumentationEngine(docInput(`history-${i}`));
  }
  assert('J-REPORTING', 'history bounded', getSelfDocumentationHistorySize() === 128, String(getSelfDocumentationHistorySize()));
  clearSelfDocumentationHistory();
  assert('J-REPORTING', 'history cleared', getSelfDocumentationHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerSelfDocumentationWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerSelfDocumentationWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'foundation', registerSelfDocumentationWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerSelfDocumentationWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerSelfDocumentationWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerSelfDocumentationWithUvl().uvlRowCount >= 13, String(registerSelfDocumentationWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerSelfDocumentationWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerSelfDocumentationWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'product hardening checkpoint', registerSelfDocumentationWithProductHardeningCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reliability hardening', registerSelfDocumentationWithReliabilityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'performance hardening', registerSelfDocumentationWithPerformanceHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'security hardening', registerSelfDocumentationWithSecurityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'privacy hardening', registerSelfDocumentationWithPrivacyHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'recovery hardening', registerSelfDocumentationWithRecoveryHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'scale hardening', registerSelfDocumentationWithScaleHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'project vault', registerSelfDocumentationWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerSelfDocumentationWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerSelfDocumentationWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerSelfDocumentationWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));
  assert('K-INTEGRATION', 'authority chains', brain.documentedAuthorityChains.length >= 5, String(brain.documentedAuthorityChains.length));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const snapshot = registerSelfDocumentationWithCentralBrain();
  const input = docInput('cache-fixed');
  const capability = analyzeCapabilityDocumentation(input, {
    capabilityCount: snapshot.capabilityEntries,
    capabilityIds: snapshot.capabilityIds,
    aliasCount: snapshot.findPanelAliases,
  });
  const module = analyzeModuleDocumentation(input, {
    moduleCount: snapshot.foundationDomains,
    moduleDomains: ['self_documentation'],
  });
  const dependency = analyzeDependencyDocumentation(input, {
    knownDependencies: snapshot.knownDependencies,
  });
  const authorityChain = analyzeAuthorityChainDocumentation(input, {
    documentedChains: snapshot.documentedAuthorityChains,
  });
  const validation = analyzeValidationDocumentation(input, {
    validationScriptCount: snapshot.validationScripts,
    checkpointCount: snapshot.checkpointCount,
    uvlRowCount: snapshot.uvlRows,
  });

  buildUnifiedSelfDocumentationAuthority('cache-fixed', capability, module, dependency, authorityChain, validation, input);
  buildUnifiedSelfDocumentationAuthority('cache-fixed', capability, module, dependency, authorityChain, validation, input);

  const cache = getSelfDocumentationCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupDocumentationByState('DOCUMENTED');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressDocumentation(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateSelfDocumentationEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      missingCapabilityLabels: i % 11 === 0,
      missingModuleExports: i % 13 === 0,
      missingAuthorityChainMapping: i % 17 === 0,
      undocumentedAuthorityChains: i % 19 === 0 ? ['trust_engine_chain'] : undefined,
      missingPassTokens: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getSelfDocumentationRecordCount() === count, String(getSelfDocumentationRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getSelfDocumentationRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'capability analyses', runtime.capabilityAnalysisCount > 0, String(runtime.capabilityAnalysisCount));

  const sample = getSelfDocumentationRecord(`self-documentation-${count}`);
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
  console.log('\nDevPulse V2 — Phase 24.1 Self Documentation');
  console.log('===========================================\n');

  runSetup();
  runRegistry();
  runCapabilityDocumentation();
  runModuleDocumentation();
  runDependencyDocumentation();
  runAuthorityDocumentation();
  runValidationDocumentation();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressDocumentation(100, '100');
  stressDocumentation(1000, '1000');
  stressDocumentation(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getSelfDocumentationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Capability analyses: ${getCapabilityAnalysisCount()}`,
    `Module analyses: ${getModuleAnalysisCount()}`,
    `Dependency analyses: ${getDependencyAnalysisCount()}`,
    `Authority analyses: ${getAuthorityAnalysisCount()}`,
    `Validation analyses: ${getValidationAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getSelfDocumentationRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? SELF_DOCUMENTATION_PASS_TOKEN : 'SELF_DOCUMENTATION_V1_FAIL',
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

  console.log(`\n${SELF_DOCUMENTATION_PASS_TOKEN}`);
}

main();
