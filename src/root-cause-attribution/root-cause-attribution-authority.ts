/**
 * DevPulse V2 Root Cause Attribution Authority — diagnostic reasoning layer.
 * Does NOT execute, repair, recover, or generate code.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { PREDICTION_OWNER_MODULE } from '../failure-prediction/types.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { LOOP_OWNER_MODULE } from '../verification-loop/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestAttributionSummary,
  publishAttributionSummary,
  resetAttributionBrainBridgeForTests,
} from './attribution-brain-bridge.js';
import {
  collectAttributionEvidence,
  getEvidenceAttributionSummary,
  resetAttributionEvidenceBridgeForTests,
} from './attribution-evidence-bridge.js';
import {
  getPredictionAttributionSummary,
} from './attribution-prediction-bridge.js';
import {
  getObservationAttributionSummary,
} from './attribution-self-vision-bridge.js';
import {
  analyzeSessionReplayHistory,
  getReplayAttributionSummary,
} from './attribution-session-replay-bridge.js';
import {
  analyzeVerificationHistory,
  getVerificationAttributionSummary,
} from './attribution-verification-bridge.js';
import {
  analyzeEvidence,
  analyzePredictionSignals,
  analyzeReplayHistory,
  generateAttributions,
  generateCauseCandidates,
  summarizeAttributions,
} from './root-cause-attribution-engine.js';
import { createAttributionRecord } from './root-cause-attribution-scoring.js';
import { formatRootCauseAttributionReport } from './root-cause-attribution-report.js';
import type {
  AttributionRecord,
  AttributionSummary,
  CauseCandidate,
  RootCauseAttributionAuthorityState,
} from './types.js';
import { ATTRIBUTION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RootCauseAttributionAuthority | null = null;

export class DevPulseV2RootCauseAttributionAuthority {
  private readonly attributions: AttributionRecord[] = [];
  private readonly candidates: CauseCandidate[] = [];
  private authorityWarnings: string[] = [
    'Root Cause Attribution identifies likely causes only — no execution, repair, recovery, or code generation.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = ATTRIBUTION_OWNER_MODULE;
  static readonly ownerDomain = 'root_cause_attribution' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('root_cause_attribution');
    return owner.ownerModule === ATTRIBUTION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const attribution = getDevPulseV2Owner('root_cause_attribution');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      attribution.ownerModule === ATTRIBUTION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2RootCauseAttributionAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRepairs(): boolean {
    const authority = new DevPulseV2RootCauseAttributionAuthority();
    return (
      typeof (authority as { repair?: unknown }).repair === 'undefined' &&
      typeof (authority as { fix?: unknown }).fix === 'undefined' &&
      typeof (authority as { remediate?: unknown }).remediate === 'undefined'
    );
  }

  static assertDoesNotPerformRecovery(): boolean {
    const authority = new DevPulseV2RootCauseAttributionAuthority();
    return (
      typeof (authority as { recover?: unknown }).recover === 'undefined' &&
      typeof (authority as { rollback?: unknown }).rollback === 'undefined' &&
      typeof (authority as { performRecovery?: unknown }).performRecovery === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2RootCauseAttributionAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceFailurePrediction(): boolean {
    return getDevPulseV2Owner('failure_prediction').ownerModule === PREDICTION_OWNER_MODULE;
  }

  static assertDoesNotReplaceVerificationLoop(): boolean {
    return getDevPulseV2Owner('verification_loop').ownerModule === LOOP_OWNER_MODULE;
  }

  static assertDoesNotReplaceEvidenceRegistry(): boolean {
    return getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  createAttributionRecord(
    input: Omit<AttributionRecord, 'attributionId' | 'createdAt'>,
  ): AttributionRecord {
    const record = createAttributionRecord(input);
    this.attributions.push({
      ...record,
      supportingEvidenceIds: [...record.supportingEvidenceIds],
      supportingPredictionIds: [...record.supportingPredictionIds],
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
    return { ...record };
  }

  createAttributionSummary(records: AttributionRecord[]): AttributionSummary {
    return summarizeAttributions(records);
  }

  analyzeEvidence() {
    return analyzeEvidence();
  }

  analyzeReplayHistory() {
    return analyzeReplayHistory();
  }

  analyzePredictionSignals() {
    return analyzePredictionSignals();
  }

  generateCauseCandidates(): CauseCandidate[] {
    const generated = generateCauseCandidates();
    this.candidates.length = 0;
    this.candidates.push(...generated);
    return generated.map((c) => ({ ...c }));
  }

  generateAttributions(): AttributionRecord[] {
    const generated = generateAttributions();
    this.attributions.length = 0;
    for (const record of generated) {
      this.attributions.push({
        ...record,
        supportingEvidenceIds: [...record.supportingEvidenceIds],
        supportingPredictionIds: [...record.supportingPredictionIds],
        warnings: [...record.warnings],
        errors: [...record.errors],
      });
    }
    return this.getAttributionRecords();
  }

  summarizeAttributions(records?: AttributionRecord[]): AttributionSummary {
    return summarizeAttributions(records ?? this.getAttributionRecords());
  }

  collectAttributionEvidence(records?: AttributionRecord[]) {
    return collectAttributionEvidence(records ?? this.getAttributionRecords());
  }

  publishAttributionSummary(summary: AttributionSummary): AttributionSummary {
    return publishAttributionSummary(summary);
  }

  getLatestAttributionSummary(): AttributionSummary | null {
    return getLatestAttributionSummary();
  }

  getPredictionAttributionSummary(): string {
    return getPredictionAttributionSummary();
  }

  getReplayAttributionSummary(): string {
    return getReplayAttributionSummary();
  }

  getObservationAttributionSummary(): string {
    return getObservationAttributionSummary();
  }

  getVerificationAttributionSummary(): string {
    return getVerificationAttributionSummary();
  }

  getEvidenceAttributionSummary(): string {
    return getEvidenceAttributionSummary();
  }

  getAttributionRecords(): AttributionRecord[] {
    return this.attributions.map((r) => ({
      ...r,
      supportingEvidenceIds: [...r.supportingEvidenceIds],
      supportingPredictionIds: [...r.supportingPredictionIds],
      warnings: [...r.warnings],
      errors: [...r.errors],
    }));
  }

  getCauseCandidates(): CauseCandidate[] {
    return this.candidates.map((c) => ({
      ...c,
      supportingEvidenceIds: [...c.supportingEvidenceIds],
      supportingPredictionIds: [...c.supportingPredictionIds],
      warnings: [...c.warnings],
      errors: [...c.errors],
    }));
  }

  getAuthorityState(): RootCauseAttributionAuthorityState {
    return {
      ownerModule: ATTRIBUTION_OWNER_MODULE,
      attributionCount: this.attributions.length,
      candidateCount: this.candidates.length,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  formatReport(): string {
    return formatRootCauseAttributionReport(
      this.getAttributionRecords(),
      this.getLatestAttributionSummary(),
    );
  }
}

export function createDevPulseV2RootCauseAttributionAuthority(): DevPulseV2RootCauseAttributionAuthority {
  singleton = new DevPulseV2RootCauseAttributionAuthority();
  return singleton;
}

export function getDevPulseV2RootCauseAttributionAuthority(): DevPulseV2RootCauseAttributionAuthority {
  if (!singleton) {
    singleton = new DevPulseV2RootCauseAttributionAuthority();
  }
  return singleton;
}

export function resetDevPulseV2RootCauseAttributionAuthorityForTests(): DevPulseV2RootCauseAttributionAuthority {
  resetAttributionBrainBridgeForTests();
  resetAttributionEvidenceBridgeForTests();
  singleton = new DevPulseV2RootCauseAttributionAuthority();
  return singleton;
}
