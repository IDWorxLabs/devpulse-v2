/**
 * User Guides — orchestration and read-only integrations.
 * User documentation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listUserGuidesUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2SelfDocumentation } from '../self-documentation/index.js';
import { getDevPulseV2FounderGuides } from '../founder-guides/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2SecurityHardening } from '../security-hardening/index.js';
import { getDevPulseV2PrivacyHardening } from '../privacy-hardening/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2OperatorFeed } from '../operator-feed/index.js';
import { getDevPulseV2FounderInboxFoundation } from '../founder-inbox/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import type {
  UserGuideRecord,
  UserGuidesInput,
  UserGuidesResult,
  UserGuidesRuntimeReport,
} from './user-guides-types.js';
import {
  USER_GUIDES_OWNER_MODULE,
  USER_GUIDES_PASS_TOKEN,
} from './user-guides-types.js';
import { analyzeOnboardingGuide, getOnboardingAnalysisCount } from './onboarding-guide-analyzer.js';
import { analyzeWorkflowGuide, getWorkflowAnalysisCount } from './workflow-guide-analyzer.js';
import { analyzeFeatureDiscoveryGuide, getFeatureAnalysisCount } from './feature-discovery-guide-analyzer.js';
import { analyzeSafetyGuide, getSafetyAnalysisCount } from './safety-guide-analyzer.js';
import {
  analyzeResultsInterpretationGuide,
  getInterpretationAnalysisCount,
} from './results-interpretation-guide-analyzer.js';
import { buildUnifiedUserGuidesAuthority, getAuthorityBuildCount } from './user-guides-authority-builder.js';
import { evaluateUserGuides, getEvaluationCount } from './user-guides-evaluator.js';
import {
  registerUserGuideRecord,
  getUserGuideRecordCount,
} from './user-guides-registry.js';
import { recordUserGuidesHistory } from './user-guides-history.js';
import { generateUserGuidesReport } from './user-guides-reporting.js';
import { getUserGuidesCacheStats } from './user-guides-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface UserGuidesSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  selfDocumentationToken: string;
  founderGuidesToken: string;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  world2Token: string;
  mobileCommandToken: string;
  operatorFeedToken: string;
  notificationVaultToken: string;
  reliabilityHardeningToken: string;
  securityHardeningToken: string;
  privacyHardeningToken: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: UserGuidesSystemSnapshot | null = null;
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

export function getDevPulseV2UserGuides(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: USER_GUIDES_OWNER_MODULE,
    passToken: USER_GUIDES_PASS_TOKEN,
    phase: 24.3,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerUserGuidesWithCentralBrain(): UserGuidesSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    selfDocumentationToken: getDevPulseV2SelfDocumentation().passToken,
    founderGuidesToken: getDevPulseV2FounderGuides().passToken,
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    operatorFeedToken: getDevPulseV2OperatorFeed().passToken,
    notificationVaultToken: getDevPulseV2FounderInboxFoundation().passToken,
    reliabilityHardeningToken: getDevPulseV2ReliabilityHardening().passToken,
    securityHardeningToken: getDevPulseV2SecurityHardening().passToken,
    privacyHardeningToken: getDevPulseV2PrivacyHardening().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerUserGuidesWithSelfDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfDocumentation().passToken, readOnly: true };
}

export function registerUserGuidesWithFounderGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderGuides().passToken, readOnly: true };
}

export function registerUserGuidesWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerUserGuidesWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerUserGuidesWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerUserGuidesWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listUserGuidesUvlRows().length, readOnly: true };
}

export function registerUserGuidesWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerUserGuidesWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerUserGuidesWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerUserGuidesWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerUserGuidesWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerUserGuidesWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerUserGuidesWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerUserGuidesWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerUserGuidesWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateUserGuidesEngine(input: UserGuidesInput): UserGuidesResult {
  const snapshot = registerUserGuidesWithCentralBrain();

  const onboarding = analyzeOnboardingGuide(input, {
    hasChatSystem: snapshot.centralBrainSystems >= 0,
    hasNotificationSystem: snapshot.notificationVaultToken.length > 0,
    hasVerificationSystem: snapshot.validationScripts > 0,
    hasMobileSystem: snapshot.mobileCommandToken.length > 0,
  });
  const workflow = analyzeWorkflowGuide(input, {
    hasProjectWorkflow: snapshot.foundationDomains > 0,
    hasVerificationWorkflow: snapshot.validationScripts > 0,
    hasNotificationWorkflow: snapshot.notificationVaultToken.length > 0,
    hasMobileWorkflow: snapshot.mobileCommandToken.length > 0,
    hasWorld2Workflow: snapshot.world2Token.length > 0,
  });
  const feature = analyzeFeatureDiscoveryGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    hasMobileFeatures: snapshot.mobileCommandToken.length > 0,
    hasCloudFeatures: snapshot.world2Token.length > 0,
  });
  const safety = analyzeSafetyGuide(input, {
    hasTrustSystem: snapshot.unifiedTrustScoreToken.length > 0,
    hasPrivacyHardening: snapshot.privacyHardeningToken.length > 0,
    hasSecurityHardening: snapshot.securityHardeningToken.length > 0,
    hasMobileControl: snapshot.mobileCommandToken.length > 0,
  });
  const interpretation = analyzeResultsInterpretationGuide(input, {
    hasTrustScore: snapshot.unifiedTrustScoreToken.length > 0,
    hasVerificationResults: snapshot.validationScripts > 0,
    hasHardeningScores: snapshot.reliabilityHardeningToken.length > 0,
    hasCheckpoints: snapshot.trustEngineCheckpointToken.length > 0,
  });

  const authority = buildUnifiedUserGuidesAuthority(
    input.requestId,
    onboarding,
    workflow,
    feature,
    safety,
    interpretation,
    input,
  );
  const evaluation = evaluateUserGuides(authority);

  recordCounter += 1;
  const record: UserGuideRecord = {
    guideId: `user-guides-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    completenessLevel: evaluation.completenessLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    userCoverageScore: evaluation.userCoverageScore,
    onboardingCoverageScore: evaluation.onboardingCoverageScore,
    workflowCoverageScore: evaluation.workflowCoverageScore,
    generatedAt: Date.now(),
  };

  registerUserGuideRecord(record);
  recordUserGuidesHistory(record);

  const missingSignals: string[] = [];
  if (onboarding.undocumentedOnboardingAreas.length > 0) missingSignals.push('undocumented_onboarding');
  if (workflow.undocumentedWorkflows.length > 0) missingSignals.push('undocumented_workflows');
  if (feature.undocumentedFeatures.length > 0) missingSignals.push('undocumented_features');
  if (safety.undocumentedSafetyAreas.length > 0) missingSignals.push('undocumented_safety');
  if (interpretation.undocumentedResultAreas.length > 0) missingSignals.push('undocumented_interpretation');

  const report = generateUserGuidesReport(
    record,
    evaluation,
    onboarding,
    workflow,
    feature,
    safety,
    interpretation,
    missingSignals,
  );

  return { record, report };
}

export function getUserGuidesRuntimeReport(): UserGuidesRuntimeReport {
  const cache = getUserGuidesCacheStats();
  return {
    onboardingAnalysisCount: getOnboardingAnalysisCount(),
    workflowAnalysisCount: getWorkflowAnalysisCount(),
    featureAnalysisCount: getFeatureAnalysisCount(),
    safetyAnalysisCount: getSafetyAnalysisCount(),
    interpretationAnalysisCount: getInterpretationAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getUserGuideRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetUserGuidesOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
