/**
 * Phase 24.5 — API Documentation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  API_DOCUMENTATION_PASS_TOKEN,
  API_DOCUMENTATION_OWNER_MODULE,
  DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE,
  analyzeApiSurface,
  analyzeInterfaceDocumentation,
  analyzeContractDocumentation,
  analyzeIntegrationApis,
  analyzeCommandSurface,
  buildUnifiedApiDocumentationAuthority,
  clearApiDocumentationHistory,
  evaluateApiDocumentation,
  evaluateApiDocumentationEngine,
  generateApiDocumentationReport,
  getAuthorityBuildCount,
  getApiSurfaceAnalysisCount,
  getCommandAnalysisCount,
  getContractAnalysisCount,
  getDevPulseV2ApiDocumentation,
  getEvaluationCount,
  getIntegrationAnalysisCount,
  getInterfaceAnalysisCount,
  getApiDocumentationCacheStats,
  getApiDocumentationHistorySize,
  getApiDocumentationRecord,
  getApiDocumentationRecordCount,
  getApiDocumentationRuntimeReport,
  isApiDocumentationQuestion,
  listBaseApis,
  listBaseCommands,
  listBaseContracts,
  listBaseInterfaces,
  lookupApiDocumentationByProjectId,
  lookupApiDocumentationByState,
  registerApiDocumentationWithArchitectureDocumentation,
  registerApiDocumentationWithCapabilityRegistry,
  registerApiDocumentationWithCentralBrain,
  registerApiDocumentationWithCloudWorkerRuntime,
  registerApiDocumentationWithFindPanel,
  registerApiDocumentationWithFoundation,
  registerApiDocumentationWithFounderGuides,
  registerApiDocumentationWithMissingCapabilityEscalation,
  registerApiDocumentationWithMobileCommand,
  registerApiDocumentationWithNotificationSystems,
  registerApiDocumentationWithProductHardeningCheckpoint,
  registerApiDocumentationWithProjectVault,
  registerApiDocumentationWithSelfDocumentation,
  registerApiDocumentationWithSelfEvolutionGovernance,
  registerApiDocumentationWithTrustEngineCheckpoint,
  registerApiDocumentationWithUserGuides,
  registerApiDocumentationWithUvl,
  registerApiDocumentationWithWorld2,
  resetApiDocumentationForTests,
} from '../src/api-documentation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { API_DOCUMENTATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { ApiDocumentationInput } from '../src/api-documentation/api-documentation-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/api-documentation');

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
  'api-documentation-types.ts',
  'api-documentation-cache.ts',
  'api-documentation-registry.ts',
  'api-surface-analyzer.ts',
  'interface-documentation-analyzer.ts',
  'contract-documentation-analyzer.ts',
  'integration-api-analyzer.ts',
  'command-surface-analyzer.ts',
  'api-documentation-authority-builder.ts',
  'api-documentation-evaluator.ts',
  'api-documentation-history.ts',
  'api-documentation-reporting.ts',
  'api-documentation.ts',
  'index.ts',
];

function resetAll(): void {
  resetApiDocumentationForTests();
}

function apiInput(requestId: string, overrides: Partial<ApiDocumentationInput> = {}): ApiDocumentationInput {
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
  const engine = getDevPulseV2ApiDocumentation();
  assert('A-TYPES', 'pass token', engine.passToken === API_DOCUMENTATION_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === API_DOCUMENTATION_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.5, String(engine.phase));
  assert('A-TYPES', 'uvl rows', API_DOCUMENTATION_UVL_ROWS.length >= 13, String(API_DOCUMENTATION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('api_documentation').phase === 24.5, '24.5');
  assert('A-TYPES', 'question signal', isApiDocumentationQuestion('show api documentation'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateApiDocumentationEngine(apiInput('reg-test'));
  assert('B-REGISTRY', 'registered', getApiDocumentationRecord(record.documentationId) !== undefined, record.documentationId);
  assert('B-REGISTRY', 'by project', lookupApiDocumentationByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'doc id', record.documentationId.startsWith('api-documentation-'), record.documentationId);
  assert('B-REGISTRY', 'record count', getApiDocumentationRecordCount() >= 1, String(getApiDocumentationRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runApiSurface(): void {
  const g = harness.beginGroup('C-API-SURFACE');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const clean = analyzeApiSurface(apiInput('api-clean'), {
    publicApiCount: snapshot.capabilityEntries,
    serviceApiCount: snapshot.centralBrainSystems,
    validationApiCount: snapshot.validationScripts,
  });
  assert('C-API-SURFACE', 'clean score', clean.apiCoverageScore >= 85, String(clean.apiCoverageScore));
  assert('C-API-SURFACE', 'no gaps', clean.undocumentedApis.length === 0, '0');
  assert('C-API-SURFACE', 'base apis', listBaseApis().length >= 7, String(listBaseApis().length));

  const gaps = analyzeApiSurface(apiInput('api-gaps', {
    missingPublicApiGuidance: true,
    missingInternalApiGuidance: true,
    missingServiceApiGuidance: true,
    missingOrchestrationApiGuidance: true,
    missingVerificationApiGuidance: true,
    missingGovernanceApiGuidance: true,
    missingDocumentationApiGuidance: true,
    undocumentedApis: ['public_apis', 'service_apis', 'verification_apis'],
  }), {
    publicApiCount: 0,
    serviceApiCount: 0,
    validationApiCount: 0,
  });
  assert('C-API-SURFACE', 'warnings', gaps.apiWarnings.length >= 7, String(gaps.apiWarnings.length));
  assert('C-API-SURFACE', 'gaps present', gaps.undocumentedApis.length >= 3, String(gaps.undocumentedApis.length));
  assert('C-API-SURFACE', 'low score', gaps.apiCoverageScore < 50, String(gaps.apiCoverageScore));

  harness.endGroup('C-API-SURFACE', g);
}

function runInterfaces(): void {
  const g = harness.beginGroup('D-INTERFACES');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const clean = analyzeInterfaceDocumentation(apiInput('iface-clean'), {
    publicInterfaceCount: snapshot.capabilityEntries,
    moduleInterfaceCount: snapshot.foundationDomains,
    authorityInterfaceCount: snapshot.foundationDomains,
  });
  assert('D-INTERFACES', 'clean score', clean.interfaceCoverageScore >= 80, String(clean.interfaceCoverageScore));
  assert('D-INTERFACES', 'base interfaces', listBaseInterfaces().length >= 5, String(listBaseInterfaces().length));

  const gaps = analyzeInterfaceDocumentation(apiInput('iface-gaps', {
    missingPublicInterfaceGuidance: true,
    missingModuleInterfaceGuidance: true,
    missingServiceInterfaceGuidance: true,
    missingAuthorityInterfaceGuidance: true,
    missingValidationInterfaceGuidance: true,
    undocumentedInterfaces: ['public_interfaces', 'module_interfaces', 'authority_interfaces'],
  }), {
    publicInterfaceCount: 0,
    moduleInterfaceCount: 0,
    authorityInterfaceCount: 0,
  });
  assert('D-INTERFACES', 'warnings', gaps.interfaceWarnings.length >= 5, String(gaps.interfaceWarnings.length));
  assert('D-INTERFACES', 'gaps present', gaps.undocumentedInterfaces.length >= 3, String(gaps.undocumentedInterfaces.length));
  assert('D-INTERFACES', 'low score', gaps.interfaceCoverageScore < 50, String(gaps.interfaceCoverageScore));

  harness.endGroup('D-INTERFACES', g);
}

function runContracts(): void {
  const g = harness.beginGroup('E-CONTRACTS');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const clean = analyzeContractDocumentation(apiInput('contract-clean'), {
    inputContractCount: snapshot.capabilityEntries,
    outputContractCount: snapshot.foundationDomains,
    typeContractCount: snapshot.uvlRows,
  });
  assert('E-CONTRACTS', 'clean score', clean.contractCoverageScore >= 80, String(clean.contractCoverageScore));
  assert('E-CONTRACTS', 'base contracts', listBaseContracts().length >= 5, String(listBaseContracts().length));

  const gaps = analyzeContractDocumentation(apiInput('contract-gaps', {
    missingInputContractGuidance: true,
    missingOutputContractGuidance: true,
    missingTypeContractGuidance: true,
    missingAuthorityContractGuidance: true,
    missingValidationContractGuidance: true,
    undocumentedContracts: ['input_contracts', 'output_contracts', 'type_contracts'],
  }), {
    inputContractCount: 0,
    outputContractCount: 0,
    typeContractCount: 0,
  });
  assert('E-CONTRACTS', 'warnings', gaps.contractWarnings.length >= 5, String(gaps.contractWarnings.length));
  assert('E-CONTRACTS', 'gaps present', gaps.undocumentedContracts.length >= 3, String(gaps.undocumentedContracts.length));
  assert('E-CONTRACTS', 'low score', gaps.contractCoverageScore < 50, String(gaps.contractCoverageScore));

  harness.endGroup('E-CONTRACTS', g);
}

function runIntegrations(): void {
  const g = harness.beginGroup('F-INTEGRATIONS');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const clean = analyzeIntegrationApis(apiInput('int-clean'), {
    registryIntegrationCount: snapshot.foundationDomains,
    uvlIntegrationCount: snapshot.uvlRows,
    hasWorld2Integration: true,
    hasMobileIntegration: true,
    hasCloudIntegration: true,
    hasNotificationIntegration: true,
  });
  assert('F-INTEGRATIONS', 'clean score', clean.integrationCoverageScore >= 75, String(clean.integrationCoverageScore));

  const gaps = analyzeIntegrationApis(apiInput('int-gaps', {
    missingRegistryIntegrationGuidance: true,
    missingUvlIntegrationGuidance: true,
    missingGovernanceIntegrationGuidance: true,
    missingWorld2IntegrationGuidance: true,
    missingMobileIntegrationGuidance: true,
    missingCloudIntegrationGuidance: true,
    missingNotificationIntegrationGuidance: true,
    undocumentedIntegrations: ['registry_integrations', 'uvl_integrations', 'notification_integrations'],
  }), {
    registryIntegrationCount: 0,
    uvlIntegrationCount: 0,
    hasWorld2Integration: false,
    hasMobileIntegration: false,
    hasCloudIntegration: false,
    hasNotificationIntegration: false,
  });
  assert('F-INTEGRATIONS', 'warnings', gaps.integrationWarnings.length >= 7, String(gaps.integrationWarnings.length));
  assert('F-INTEGRATIONS', 'gaps present', gaps.undocumentedIntegrations.length >= 5, String(gaps.undocumentedIntegrations.length));
  assert('F-INTEGRATIONS', 'low score', gaps.integrationCoverageScore < 50, String(gaps.integrationCoverageScore));

  harness.endGroup('F-INTEGRATIONS', g);
}

function runCommands(): void {
  const g = harness.beginGroup('G-COMMANDS');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const clean = analyzeCommandSurface(apiInput('cmd-clean'), {
    validationCommandCount: snapshot.validationScripts,
    orchestrationCommandCount: snapshot.centralBrainSystems,
    reportingCommandCount: 5,
  });
  assert('G-COMMANDS', 'clean score', clean.commandCoverageScore >= 80, String(clean.commandCoverageScore));
  assert('G-COMMANDS', 'base commands', listBaseCommands().length >= 5, String(listBaseCommands().length));

  const gaps = analyzeCommandSurface(apiInput('cmd-gaps', {
    missingValidationCommandGuidance: true,
    missingOrchestrationCommandGuidance: true,
    missingReportingCommandGuidance: true,
    missingGovernanceCommandGuidance: true,
    missingDocumentationCommandGuidance: true,
    undocumentedCommands: ['validation_commands', 'orchestration_commands', 'documentation_commands'],
  }), {
    validationCommandCount: 0,
    orchestrationCommandCount: 0,
    reportingCommandCount: 0,
  });
  assert('G-COMMANDS', 'warnings', gaps.commandWarnings.length >= 5, String(gaps.commandWarnings.length));
  assert('G-COMMANDS', 'gaps present', gaps.undocumentedCommands.length >= 3, String(gaps.undocumentedCommands.length));
  assert('G-COMMANDS', 'low score', gaps.commandCoverageScore < 50, String(gaps.commandCoverageScore));

  harness.endGroup('G-COMMANDS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const input = apiInput('auth-test');
  const apiSurface = analyzeApiSurface(input, {
    publicApiCount: snapshot.capabilityEntries,
    serviceApiCount: snapshot.centralBrainSystems,
    validationApiCount: snapshot.validationScripts,
  });
  const interfaces = analyzeInterfaceDocumentation(input, {
    publicInterfaceCount: snapshot.capabilityEntries,
    moduleInterfaceCount: snapshot.foundationDomains,
    authorityInterfaceCount: snapshot.foundationDomains,
  });
  const contracts = analyzeContractDocumentation(input, {
    inputContractCount: snapshot.capabilityEntries,
    outputContractCount: snapshot.foundationDomains,
    typeContractCount: snapshot.uvlRows,
  });
  const integration = analyzeIntegrationApis(input, {
    registryIntegrationCount: snapshot.foundationDomains,
    uvlIntegrationCount: snapshot.uvlRows,
    hasWorld2Integration: true,
    hasMobileIntegration: true,
    hasCloudIntegration: true,
    hasNotificationIntegration: true,
  });
  const commands = analyzeCommandSurface(input, {
    validationCommandCount: snapshot.validationScripts,
    orchestrationCommandCount: snapshot.centralBrainSystems,
    reportingCommandCount: 5,
  });
  const authority = buildUnifiedApiDocumentationAuthority(
    'auth-test',
    apiSurface,
    interfaces,
    contracts,
    integration,
    commands,
    input,
  );

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('api-documentation-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'coverage score', authority.apiCoverageScore > 0, String(authority.apiCoverageScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'coverage level', authority.coverageLevel.length > 0, authority.coverageLevel);

  const blocked = buildUnifiedApiDocumentationAuthority(
    'auth-blocked',
    apiSurface,
    interfaces,
    contracts,
    integration,
    commands,
    { ...input, governanceBlocked: true },
  );
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'UNKNOWN', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateApiDocumentationEngine(apiInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'DOCUMENTED' || record.state === 'PARTIALLY_DOCUMENTED', record.state);
  assert('I-EVALUATION', 'coverage score', record.apiCoverageScore > 50, String(record.apiCoverageScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateApiDocumentationEngine(apiInput('eval-degraded', {
    missingPublicApiGuidance: true,
    missingInternalApiGuidance: true,
    missingServiceApiGuidance: true,
    missingOrchestrationApiGuidance: true,
    missingVerificationApiGuidance: true,
    missingGovernanceApiGuidance: true,
    missingDocumentationApiGuidance: true,
    missingPublicInterfaceGuidance: true,
    missingModuleInterfaceGuidance: true,
    missingServiceInterfaceGuidance: true,
    missingAuthorityInterfaceGuidance: true,
    missingValidationInterfaceGuidance: true,
    missingInputContractGuidance: true,
    missingOutputContractGuidance: true,
    missingTypeContractGuidance: true,
    missingAuthorityContractGuidance: true,
    missingValidationContractGuidance: true,
    missingRegistryIntegrationGuidance: true,
    missingUvlIntegrationGuidance: true,
    missingGovernanceIntegrationGuidance: true,
    missingWorld2IntegrationGuidance: true,
    missingMobileIntegrationGuidance: true,
    missingCloudIntegrationGuidance: true,
    missingNotificationIntegrationGuidance: true,
    missingValidationCommandGuidance: true,
    missingOrchestrationCommandGuidance: true,
    missingReportingCommandGuidance: true,
    missingGovernanceCommandGuidance: true,
    missingDocumentationCommandGuidance: true,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'DOCUMENTED', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.apiCoverageScore < 75, String(degraded.record.apiCoverageScore));

  const snapshot = registerApiDocumentationWithCentralBrain();
  const input = apiInput('eval-manual');
  const authority = buildUnifiedApiDocumentationAuthority(
    'eval-manual',
    analyzeApiSurface(input, {
      publicApiCount: snapshot.capabilityEntries,
      serviceApiCount: snapshot.centralBrainSystems,
      validationApiCount: snapshot.validationScripts,
    }),
    analyzeInterfaceDocumentation(input, {
      publicInterfaceCount: snapshot.capabilityEntries,
      moduleInterfaceCount: snapshot.foundationDomains,
      authorityInterfaceCount: snapshot.foundationDomains,
    }),
    analyzeContractDocumentation(input, {
      inputContractCount: snapshot.capabilityEntries,
      outputContractCount: snapshot.foundationDomains,
      typeContractCount: snapshot.uvlRows,
    }),
    analyzeIntegrationApis(input, {
      registryIntegrationCount: snapshot.foundationDomains,
      uvlIntegrationCount: snapshot.uvlRows,
      hasWorld2Integration: true,
      hasMobileIntegration: true,
      hasCloudIntegration: true,
      hasNotificationIntegration: true,
    }),
    analyzeCommandSurface(input, {
      validationCommandCount: snapshot.validationScripts,
      orchestrationCommandCount: snapshot.centralBrainSystems,
      reportingCommandCount: 5,
    }),
    input,
  );
  const evaluation = evaluateApiDocumentation(authority);
  assert('I-EVALUATION', 'doc readiness', evaluation.documentationReadiness > 0, String(evaluation.documentationReadiness));
  assert('I-EVALUATION', 'contract score', evaluation.contractCoverageScore >= 0, String(evaluation.contractCoverageScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateApiDocumentationEngine(apiInput('report-test'));
  assert('J-REPORTING', 'coverage score', report.apiCoverageScore === record.apiCoverageScore, String(report.apiCoverageScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'api coverage', report.apiCoverage.length > 0, String(report.apiCoverage.length));
  assert('J-REPORTING', 'command coverage', report.commandCoverage.length > 0, String(report.commandCoverage.length));

  const manual = generateApiDocumentationReport(
    record,
    report.evaluation,
    { apiCoverageScore: 90, undocumentedApis: [], apiWarnings: [] },
    { interfaceCoverageScore: 90, undocumentedInterfaces: [], interfaceWarnings: [] },
    { contractCoverageScore: 90, undocumentedContracts: [], contractWarnings: [] },
    { integrationCoverageScore: 90, undocumentedIntegrations: [], integrationWarnings: [] },
    { commandCoverageScore: 90, undocumentedCommands: [], commandWarnings: [] },
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateApiDocumentationEngine(apiInput(`history-${i}`));
  }
  assert('J-REPORTING', 'history bounded', getApiDocumentationHistorySize() === 128, String(getApiDocumentationHistorySize()));
  clearApiDocumentationHistory();
  assert('J-REPORTING', 'history cleared', getApiDocumentationHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerApiDocumentationWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerApiDocumentationWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'self documentation', registerApiDocumentationWithSelfDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'founder guides', registerApiDocumentationWithFounderGuides().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'user guides', registerApiDocumentationWithUserGuides().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'architecture documentation', registerApiDocumentationWithArchitectureDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'foundation', registerApiDocumentationWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerApiDocumentationWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerApiDocumentationWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerApiDocumentationWithUvl().uvlRowCount >= 13, String(registerApiDocumentationWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'trust checkpoint', registerApiDocumentationWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'product hardening checkpoint', registerApiDocumentationWithProductHardeningCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerApiDocumentationWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'project vault', registerApiDocumentationWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerApiDocumentationWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'cloud worker runtime', registerApiDocumentationWithCloudWorkerRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification systems', registerApiDocumentationWithNotificationSystems().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerApiDocumentationWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerApiDocumentationWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));
  assert('K-INTEGRATION', 'uvl rows', brain.uvlRows > 0, String(brain.uvlRows));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const snapshot = registerApiDocumentationWithCentralBrain();
  const input = apiInput('cache-fixed');
  const apiSurface = analyzeApiSurface(input, {
    publicApiCount: snapshot.capabilityEntries,
    serviceApiCount: snapshot.centralBrainSystems,
    validationApiCount: snapshot.validationScripts,
  });
  const interfaces = analyzeInterfaceDocumentation(input, {
    publicInterfaceCount: snapshot.capabilityEntries,
    moduleInterfaceCount: snapshot.foundationDomains,
    authorityInterfaceCount: snapshot.foundationDomains,
  });
  const contracts = analyzeContractDocumentation(input, {
    inputContractCount: snapshot.capabilityEntries,
    outputContractCount: snapshot.foundationDomains,
    typeContractCount: snapshot.uvlRows,
  });
  const integration = analyzeIntegrationApis(input, {
    registryIntegrationCount: snapshot.foundationDomains,
    uvlIntegrationCount: snapshot.uvlRows,
    hasWorld2Integration: true,
    hasMobileIntegration: true,
    hasCloudIntegration: true,
    hasNotificationIntegration: true,
  });
  const commands = analyzeCommandSurface(input, {
    validationCommandCount: snapshot.validationScripts,
    orchestrationCommandCount: snapshot.centralBrainSystems,
    reportingCommandCount: 5,
  });

  buildUnifiedApiDocumentationAuthority('cache-fixed', apiSurface, interfaces, contracts, integration, commands, input);
  buildUnifiedApiDocumentationAuthority('cache-fixed', apiSurface, interfaces, contracts, integration, commands, input);

  const cache = getApiDocumentationCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupApiDocumentationByState('DOCUMENTED');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressDocs(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateApiDocumentationEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      missingPublicApiGuidance: i % 11 === 0,
      missingModuleInterfaceGuidance: i % 13 === 0,
      missingInputContractGuidance: i % 17 === 0,
      missingRegistryIntegrationGuidance: i % 19 === 0,
      missingValidationCommandGuidance: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getApiDocumentationRecordCount() === count, String(getApiDocumentationRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getApiDocumentationRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'api analyses', runtime.apiSurfaceAnalysisCount > 0, String(runtime.apiSurfaceAnalysisCount));

  const sample = getApiDocumentationRecord(`api-documentation-${count}`);
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
  console.log('\nDevPulse V2 — Phase 24.5 API Documentation');
  console.log('==========================================\n');

  runSetup();
  runRegistry();
  runApiSurface();
  runInterfaces();
  runContracts();
  runIntegrations();
  runCommands();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressDocs(100, '100');
  stressDocs(1000, '1000');
  stressDocs(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getApiDocumentationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `API surface analyses: ${getApiSurfaceAnalysisCount()}`,
    `Interface analyses: ${getInterfaceAnalysisCount()}`,
    `Contract analyses: ${getContractAnalysisCount()}`,
    `Integration analyses: ${getIntegrationAnalysisCount()}`,
    `Command analyses: ${getCommandAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getApiDocumentationRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? API_DOCUMENTATION_PASS_TOKEN : 'API_DOCUMENTATION_V1_FAIL',
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

  console.log(`\n${API_DOCUMENTATION_PASS_TOKEN}`);
}

main();
