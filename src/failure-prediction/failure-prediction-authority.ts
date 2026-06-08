/**
 * DevPulse V2 Failure Prediction Authority — rule-based risk awareness layer.
 * Does NOT execute, repair, perform root cause analysis, or generate code.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REPLAY_OWNER_MODULE } from '../reality-replay/types.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../session-replay/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  analyzeFailurePatterns,
  analyzeObservationPatterns,
  analyzeReplayPatterns,
  analyzeVerificationPatterns,
  generatePredictionRecords,
  summarizePredictions,
} from './failure-prediction-engine.js';
import { createPredictionRecord } from './failure-prediction-scoring.js';
import { formatFailurePredictionReport } from './failure-prediction-report.js';
import {
  getLatestPredictionSummary,
  publishPredictionSummary,
  resetPredictionBrainBridgeForTests,
} from './prediction-brain-bridge.js';
import {
  collectPredictionEvidence,
  getLastCollectedPredictionEvidenceIds,
  getPredictionEvidenceSummary,
  resetPredictionEvidenceBridgeForTests,
} from './prediction-evidence-bridge.js';
import {
  analyzeRealityReplayPatterns,
  getRealityPredictionSummary,
} from './prediction-reality-replay-bridge.js';
import {
  analyzeObservationPatterns as analyzeObservationBridgePatterns,
  getObservationPredictionSummary,
} from './prediction-self-vision-bridge.js';
import {
  analyzeSessionReplayPatterns,
  getReplayPredictionSummary,
} from './prediction-session-replay-bridge.js';
import {
  analyzeVerificationPatterns as analyzeVerificationBridgePatterns,
  getVerificationPredictionSummary,
} from './prediction-verification-bridge.js';
import type {
  FailurePredictionAuthorityState,
  PredictionRecord,
  PredictionSummary,
} from './types.js';
import { PREDICTION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2FailurePredictionAuthority | null = null;

export class DevPulseV2FailurePredictionAuthority {
  private readonly predictions: PredictionRecord[] = [];
  private authorityWarnings: string[] = [
    'Failure Prediction identifies risk only — no execution, repair, root cause analysis, or code generation.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = PREDICTION_OWNER_MODULE;
  static readonly ownerDomain = 'failure_prediction' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('failure_prediction');
    return owner.ownerModule === PREDICTION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const prediction = getDevPulseV2Owner('failure_prediction');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      prediction.ownerModule === PREDICTION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2FailurePredictionAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRepairs(): boolean {
    const authority = new DevPulseV2FailurePredictionAuthority();
    return (
      typeof (authority as { repair?: unknown }).repair === 'undefined' &&
      typeof (authority as { fix?: unknown }).fix === 'undefined' &&
      typeof (authority as { remediate?: unknown }).remediate === 'undefined'
    );
  }

  static assertDoesNotPerformRootCauseAnalysis(): boolean {
    const authority = new DevPulseV2FailurePredictionAuthority();
    return (
      typeof (authority as { rootCause?: unknown }).rootCause === 'undefined' &&
      typeof (authority as { diagnose?: unknown }).diagnose === 'undefined' &&
      typeof (authority as { analyzeCause?: unknown }).analyzeCause === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2FailurePredictionAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceSessionReplay(): boolean {
    return getDevPulseV2Owner('session_replay').ownerModule === SESSION_REPLAY_OWNER_MODULE;
  }

  static assertDoesNotReplaceRealityReplay(): boolean {
    return getDevPulseV2Owner('reality_replay').ownerModule === REPLAY_OWNER_MODULE;
  }

  static assertDoesNotReplaceTrustEngine(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  createPredictionRecord(
    input: Omit<PredictionRecord, 'predictionId' | 'createdAt' | 'status'>,
  ): PredictionRecord {
    const record = createPredictionRecord(input);
    this.predictions.push({
      ...record,
      supportingEvidenceIds: [...record.supportingEvidenceIds],
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
    return { ...record };
  }

  createPredictionSummary(records: PredictionRecord[]): PredictionSummary {
    return summarizePredictions(records);
  }

  analyzeFailurePatterns(): PredictionRecord[] {
    return analyzeFailurePatterns();
  }

  analyzeReplayPatterns(): PredictionRecord[] {
    return analyzeReplayPatterns();
  }

  analyzeVerificationPatterns(): PredictionRecord[] {
    return analyzeVerificationPatterns();
  }

  analyzeObservationPatterns(): PredictionRecord[] {
    return analyzeObservationPatterns();
  }

  generatePredictionRecords(): PredictionRecord[] {
    const records = generatePredictionRecords();
    this.predictions.length = 0;
    for (const record of records) {
      this.predictions.push({
        ...record,
        supportingEvidenceIds: [...record.supportingEvidenceIds],
        warnings: [...record.warnings],
        errors: [...record.errors],
      });
    }
    return this.getPredictionRecords();
  }

  summarizePredictions(records?: PredictionRecord[]): PredictionSummary {
    return summarizePredictions(records ?? this.getPredictionRecords());
  }

  analyzeSessionReplayPatterns(): PredictionRecord[] {
    return analyzeSessionReplayPatterns();
  }

  analyzeRealityReplayPatterns(): PredictionRecord[] {
    return analyzeRealityReplayPatterns();
  }

  analyzeObservationBridgePatterns(): PredictionRecord[] {
    return analyzeObservationBridgePatterns();
  }

  analyzeVerificationBridgePatterns(): PredictionRecord[] {
    return analyzeVerificationBridgePatterns();
  }

  collectPredictionEvidence(records?: PredictionRecord[]) {
    return collectPredictionEvidence(records ?? this.getPredictionRecords());
  }

  publishPredictionSummary(summary: PredictionSummary): PredictionSummary {
    return publishPredictionSummary(summary);
  }

  getLatestPredictionSummary(): PredictionSummary | null {
    return getLatestPredictionSummary();
  }

  getReplayPredictionSummary(): string {
    return getReplayPredictionSummary();
  }

  getRealityPredictionSummary(): string {
    return getRealityPredictionSummary();
  }

  getObservationPredictionSummary(): string {
    return getObservationPredictionSummary();
  }

  getVerificationPredictionSummary(): string {
    return getVerificationPredictionSummary();
  }

  getPredictionEvidenceSummary(): string {
    return getPredictionEvidenceSummary();
  }

  getPredictionRecords(): PredictionRecord[] {
    return this.predictions.map((r) => ({
      ...r,
      supportingEvidenceIds: [...r.supportingEvidenceIds],
      warnings: [...r.warnings],
      errors: [...r.errors],
    }));
  }

  getAuthorityState(): FailurePredictionAuthorityState {
    return {
      ownerModule: PREDICTION_OWNER_MODULE,
      predictionCount: this.predictions.length,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  formatReport(): string {
    return formatFailurePredictionReport(
      this.getPredictionRecords(),
      this.getLatestPredictionSummary(),
      getLastCollectedPredictionEvidenceIds().length,
    );
  }
}

export function createDevPulseV2FailurePredictionAuthority(): DevPulseV2FailurePredictionAuthority {
  singleton = new DevPulseV2FailurePredictionAuthority();
  return singleton;
}

export function getDevPulseV2FailurePredictionAuthority(): DevPulseV2FailurePredictionAuthority {
  if (!singleton) {
    singleton = new DevPulseV2FailurePredictionAuthority();
  }
  return singleton;
}

export function resetDevPulseV2FailurePredictionAuthorityForTests(): DevPulseV2FailurePredictionAuthority {
  resetPredictionBrainBridgeForTests();
  resetPredictionEvidenceBridgeForTests();
  singleton = new DevPulseV2FailurePredictionAuthority();
  return singleton;
}
