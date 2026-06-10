/**
 * Evidence Intelligence — orchestration and read-only integrations.
 * Sits on top of Unified Trust Runtime. No execution, mutations, or deployment.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2UnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { getDevPulseV2AutonomousTesting } from '../autonomous-testing/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listEvidenceIntelligenceUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  EvidenceIntelligenceInput,
  EvidenceIntelligenceRecord,
  EvidenceIntelligenceResult,
  EvidenceIntelligenceRuntimeReport,
} from './evidence-intelligence-types.js';
import {
  EVIDENCE_INTELLIGENCE_OWNER_MODULE,
  EVIDENCE_INTELLIGENCE_PASS_TOKEN,
} from './evidence-intelligence-types.js';
import { listEvidenceSources, getEvidenceSourceCount } from './evidence-source-registry.js';
import { registerEvidenceRecords, getEvidenceRecordCount } from './evidence-record-registry.js';
import { buildUnifiedEvidenceAuthority, getAuthorityBuildCount } from './evidence-authority-builder.js';
import { evaluateEvidenceIntelligence as runEvaluation, getEvaluationCount } from './evidence-intelligence-evaluator.js';
import { getQualityAnalysisCount } from './evidence-quality-analyzer.js';
import { getSufficiencyAnalysisCount } from './evidence-sufficiency-analyzer.js';
import { getConflictDetectionCount } from './evidence-conflict-detector.js';
import { getGapAnalysisCount } from './evidence-gap-analyzer.js';
import { recordEvidenceIntelligenceHistory } from './evidence-intelligence-history.js';
import { generateEvidenceIntelligenceReport } from './evidence-intelligence-reporting.js';
import { getEvidenceIntelligenceCacheStats } from './evidence-intelligence-cache.js';

export interface EvidenceIntelligenceSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  unifiedTrustRuntimeToken: string;
  evidenceSourceCount: number;
  autonomousTestingToken: string;
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  verificationStrategyToken: string;
  verificationIntelligenceToken: string;
  verificationIntegrationToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  selfEvolutionGovernanceToken: string;
  world2Token: string;
  uvlRows: number;
  registeredAt: number;
}

const intelligenceRecords = new Map<string, EvidenceIntelligenceRecord>();

let cachedSnapshot: EvidenceIntelligenceSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2EvidenceIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: EVIDENCE_INTELLIGENCE_OWNER_MODULE,
    passToken: EVIDENCE_INTELLIGENCE_PASS_TOKEN,
    phase: 22.2,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerEvidenceIntelligenceWithCentralBrain(): EvidenceIntelligenceSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    trustEngineScore: trustResult?.trustScore ?? null,
    unifiedTrustRuntimeToken: getDevPulseV2UnifiedTrustRuntime().passToken,
    evidenceSourceCount: getEvidenceSourceCount(),
    autonomousTestingToken: getDevPulseV2AutonomousTesting().passToken,
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    verificationStrategyToken: getDevPulseV2VerificationStrategyCore().passToken,
    verificationIntelligenceToken: getDevPulseV2VerificationIntelligence().passToken,
    verificationIntegrationToken: getDevPulseV2VerificationIntegration().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listEvidenceIntelligenceUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerEvidenceIntelligenceWithUnifiedTrustRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustRuntime().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerEvidenceIntelligenceWithAutonomousTesting(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousTesting().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithVerificationStrategyCore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationStrategyCore().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithVerificationIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationIntelligence().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithVerificationIntegration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationIntegration().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerEvidenceIntelligenceWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerEvidenceIntelligenceWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listEvidenceIntelligenceUvlRows().length, readOnly: true };
}

export function getEvidenceIntelligenceRecord(recordId: string): EvidenceIntelligenceRecord | undefined {
  return intelligenceRecords.get(recordId);
}

export function listEvidenceIntelligenceRecords(): EvidenceIntelligenceRecord[] {
  return [...intelligenceRecords.values()];
}

export function getEvidenceIntelligenceRecordCount(): number {
  return intelligenceRecords.size;
}

export function runEvidenceIntelligence(input: EvidenceIntelligenceInput): EvidenceIntelligenceResult {
  registerEvidenceIntelligenceWithCentralBrain();
  listEvidenceSources();

  const records = registerEvidenceRecords(input.evidence, {
    project: input.project,
    workspace: input.workspace,
  });

  const { authority, quality, conflicts, gaps } = buildUnifiedEvidenceAuthority(input.requestId, records);
  const evaluation = runEvaluation(authority, quality, conflicts);

  recordCounter += 1;
  const record: EvidenceIntelligenceRecord = {
    recordId: `evidence-intelligence-${recordCounter}`,
    authority,
    evaluation,
    conflicts,
    gaps,
    createdAt: Date.now(),
  };

  intelligenceRecords.set(record.recordId, record);
  recordEvidenceIntelligenceHistory(record);
  const report = generateEvidenceIntelligenceReport(record, quality, evaluation, conflicts, gaps);

  return { record, report };
}

export function getEvidenceIntelligenceRuntimeReport(): EvidenceIntelligenceRuntimeReport {
  const cache = getEvidenceIntelligenceCacheStats();
  return {
    qualityAnalysisCount: getQualityAnalysisCount(),
    sufficiencyAnalysisCount: getSufficiencyAnalysisCount(),
    conflictDetectionCount: getConflictDetectionCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getEvidenceIntelligenceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetEvidenceIntelligenceForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
  intelligenceRecords.clear();
}
