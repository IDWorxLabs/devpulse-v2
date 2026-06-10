/**
 * Interactive Explanations — orchestration and read-only integrations.
 * Explanation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listInteractiveExplanationsUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2SelfDocumentation } from '../self-documentation/index.js';
import { getDevPulseV2FounderGuides } from '../founder-guides/index.js';
import { getDevPulseV2UserGuides } from '../user-guides/index.js';
import { getDevPulseV2ArchitectureDocumentation } from '../architecture-documentation/index.js';
import { getDevPulseV2ApiDocumentation } from '../api-documentation/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2CloudRuntimeFoundation } from '../cloud-runtime/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type {
  InteractiveExplanationRecord,
  InteractiveExplanationsInput,
  InteractiveExplanationsResult,
  InteractiveExplanationsRuntimeReport,
} from './interactive-explanations-types.js';
import {
  INTERACTIVE_EXPLANATIONS_OWNER_MODULE,
  INTERACTIVE_EXPLANATIONS_PASS_TOKEN,
} from './interactive-explanations-types.js';
import { analyzeSystemExplanation, getSystemAnalysisCount } from './system-explanation-analyzer.js';
import { analyzeWorkflowExplanation, getWorkflowAnalysisCount } from './workflow-explanation-analyzer.js';
import { analyzeReasoningExplanation, getReasoningAnalysisCount } from './reasoning-explanation-analyzer.js';
import { analyzeReportInterpretation, getReportAnalysisCount } from './report-interpretation-analyzer.js';
import { analyzeNextStepGuidance, getGuidanceAnalysisCount } from './next-step-guidance-analyzer.js';
import {
  buildUnifiedInteractiveExplanationsAuthority,
  getAuthorityBuildCount,
} from './interactive-explanations-authority-builder.js';
import { evaluateInteractiveExplanations, getEvaluationCount } from './interactive-explanations-evaluator.js';
import {
  registerInteractiveExplanationRecord,
  getInteractiveExplanationRecordCount,
} from './interactive-explanations-registry.js';
import { recordInteractiveExplanationsHistory } from './interactive-explanations-history.js';
import { generateInteractiveExplanationsReport } from './interactive-explanations-reporting.js';
import { getInteractiveExplanationsCacheStats } from './interactive-explanations-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface InteractiveExplanationsSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  selfDocumentationToken: string;
  founderGuidesToken: string;
  userGuidesToken: string;
  architectureDocumentationToken: string;
  apiDocumentationToken: string;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  world2Token: string;
  mobileCommandToken: string;
  cloudWorkerRuntimeToken: string;
  projectVaultProjectCount: number;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: InteractiveExplanationsSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function countValidationScripts(): number {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
    return Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;
  } catch {
    return 0;
  }
}

export function getDevPulseV2InteractiveExplanations(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: INTERACTIVE_EXPLANATIONS_OWNER_MODULE,
    passToken: INTERACTIVE_EXPLANATIONS_PASS_TOKEN,
    phase: 24.6,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerInteractiveExplanationsWithCentralBrain(): InteractiveExplanationsSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    selfDocumentationToken: getDevPulseV2SelfDocumentation().passToken,
    founderGuidesToken: getDevPulseV2FounderGuides().passToken,
    userGuidesToken: getDevPulseV2UserGuides().passToken,
    architectureDocumentationToken: getDevPulseV2ArchitectureDocumentation().passToken,
    apiDocumentationToken: getDevPulseV2ApiDocumentation().passToken,
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    cloudWorkerRuntimeToken: getDevPulseV2CloudRuntimeFoundation().passToken,
    projectVaultProjectCount: vaultState.projectCount,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerInteractiveExplanationsWithSelfDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfDocumentation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithFounderGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderGuides().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithUserGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UserGuides().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithArchitectureDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ArchitectureDocumentation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithApiDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ApiDocumentation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerInteractiveExplanationsWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerInteractiveExplanationsWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerInteractiveExplanationsWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listInteractiveExplanationsUvlRows().length, readOnly: true };
}

export function registerInteractiveExplanationsWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerInteractiveExplanationsWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerInteractiveExplanationsWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerInteractiveExplanationsWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerInteractiveExplanationsWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function evaluateInteractiveExplanationsEngine(
  input: InteractiveExplanationsInput,
): InteractiveExplanationsResult {
  const snapshot = registerInteractiveExplanationsWithCentralBrain();

  const system = analyzeSystemExplanation(input, {
    systemCount: snapshot.centralBrainSystems,
    capabilityCount: snapshot.capabilityEntries,
    domainCount: snapshot.foundationDomains,
  });
  const workflow = analyzeWorkflowExplanation(input, {
    hasProjectWorkflow: snapshot.foundationDomains > 0,
    hasVerificationWorkflow: snapshot.validationScripts > 0,
    hasTrustWorkflow: snapshot.unifiedTrustScoreToken.length > 0,
  });
  const reasoning = analyzeReasoningExplanation(input, {
    hasTrustReasoning: snapshot.unifiedTrustScoreToken.length > 0,
    hasVerificationReasoning: snapshot.validationScripts > 0,
    hasGovernanceReasoning: snapshot.selfEvolutionGovernanceToken.length > 0,
  });
  const report = analyzeReportInterpretation(input, {
    hasTrustReports: snapshot.unifiedTrustScoreToken.length > 0,
    hasVerificationReports: snapshot.validationScripts > 0,
    hasCheckpointReports: snapshot.trustEngineCheckpointToken.length > 0,
  });
  const guidance = analyzeNextStepGuidance(input, {
    hasRoadmapProgression: snapshot.founderGuidesToken.length > 0,
    hasCheckpointProgression: snapshot.trustEngineCheckpointToken.length > 0,
    hasDependencyProgression: snapshot.foundationDomains > 0,
  });

  const authority = buildUnifiedInteractiveExplanationsAuthority(
    input.requestId,
    system,
    workflow,
    reasoning,
    report,
    guidance,
    input,
  );
  const evaluation = evaluateInteractiveExplanations(authority);

  recordCounter += 1;
  const record: InteractiveExplanationRecord = {
    explanationId: `interactive-explanations-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    coverageLevel: evaluation.coverageLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    explanationCoverageScore: evaluation.explanationCoverageScore,
    workflowCoverageScore: evaluation.workflowCoverageScore,
    reasoningCoverageScore: evaluation.reasoningCoverageScore,
    generatedAt: Date.now(),
  };

  registerInteractiveExplanationRecord(record);
  recordInteractiveExplanationsHistory(record);

  const missingSignals: string[] = [];
  if (system.undocumentedSystems.length > 0) missingSignals.push('undocumented_systems');
  if (workflow.undocumentedWorkflows.length > 0) missingSignals.push('undocumented_workflows');
  if (reasoning.undocumentedReasoningAreas.length > 0) missingSignals.push('undocumented_reasoning');
  if (report.undocumentedReportAreas.length > 0) missingSignals.push('undocumented_reports');
  if (guidance.undocumentedGuidanceAreas.length > 0) missingSignals.push('undocumented_guidance');

  const reportResult = generateInteractiveExplanationsReport(
    record,
    evaluation,
    system,
    workflow,
    reasoning,
    report,
    guidance,
    missingSignals,
  );

  return { record, report: reportResult };
}

export function getInteractiveExplanationsRuntimeReport(): InteractiveExplanationsRuntimeReport {
  const cache = getInteractiveExplanationsCacheStats();
  return {
    systemAnalysisCount: getSystemAnalysisCount(),
    workflowAnalysisCount: getWorkflowAnalysisCount(),
    reasoningAnalysisCount: getReasoningAnalysisCount(),
    reportAnalysisCount: getReportAnalysisCount(),
    guidanceAnalysisCount: getGuidanceAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getInteractiveExplanationRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetInteractiveExplanationsOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
