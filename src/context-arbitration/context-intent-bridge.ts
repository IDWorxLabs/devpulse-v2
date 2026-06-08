/**
 * Intent bridge — Intent Architecture owns intent; Context Arbitration consumes summaries only.
 * No mutation of intent records.
 */

import { getLatestIntentSummary } from '../intent-architecture/intent-brain-bridge.js';
import { getDevPulseV2IntentArchitectureAuthority } from '../intent-architecture/intent-architecture-authority.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import type { IntentType } from '../intent-architecture/types.js';
import type { ContextPriority, ContextSource } from './types.js';
import { ALL_CONTEXT_SOURCES } from './types.js';

const INTENT_PRIORITY_MAP: Record<IntentType, Partial<Record<ContextSource, ContextPriority>>> = {
  BUILD_REQUEST: {
    INTENT_ARCHITECTURE: 'HIGH',
    PROJECT_VAULT: 'HIGH',
    CENTRAL_BRAIN: 'MEDIUM',
    TRUST_ENGINE: 'MEDIUM',
    EVIDENCE_REGISTRY: 'LOW',
    TIMELINE_LEDGER: 'IGNORE',
  },
  QUESTION: {
    INTENT_ARCHITECTURE: 'HIGH',
    CENTRAL_BRAIN: 'MEDIUM',
    PROJECT_VAULT: 'LOW',
    TRUST_ENGINE: 'IGNORE',
    EVIDENCE_REGISTRY: 'IGNORE',
    TIMELINE_LEDGER: 'IGNORE',
  },
  ANALYSIS_REQUEST: {
    INTENT_ARCHITECTURE: 'HIGH',
    EVIDENCE_REGISTRY: 'HIGH',
    CENTRAL_BRAIN: 'HIGH',
    TRUST_ENGINE: 'MEDIUM',
    TIMELINE_LEDGER: 'MEDIUM',
    PROJECT_VAULT: 'MEDIUM',
  },
  PROJECT_REQUEST: {
    INTENT_ARCHITECTURE: 'HIGH',
    PROJECT_VAULT: 'HIGH',
    CENTRAL_BRAIN: 'MEDIUM',
    TIMELINE_LEDGER: 'LOW',
    EVIDENCE_REGISTRY: 'LOW',
    TRUST_ENGINE: 'MEDIUM',
  },
  INFORMATION_REQUEST: {
    INTENT_ARCHITECTURE: 'HIGH',
    CENTRAL_BRAIN: 'MEDIUM',
    PROJECT_VAULT: 'MEDIUM',
    EVIDENCE_REGISTRY: 'LOW',
    TIMELINE_LEDGER: 'IGNORE',
    TRUST_ENGINE: 'IGNORE',
  },
  UNKNOWN: {
    INTENT_ARCHITECTURE: 'MEDIUM',
    CENTRAL_BRAIN: 'MEDIUM',
    PROJECT_VAULT: 'LOW',
    TIMELINE_LEDGER: 'LOW',
    EVIDENCE_REGISTRY: 'LOW',
    TRUST_ENGINE: 'LOW',
  },
};

const INTENT_REQUIREMENTS: Record<IntentType, ContextSource[]> = {
  BUILD_REQUEST: ['INTENT_ARCHITECTURE', 'PROJECT_VAULT', 'CENTRAL_BRAIN', 'TRUST_ENGINE'],
  QUESTION: ['INTENT_ARCHITECTURE', 'CENTRAL_BRAIN'],
  ANALYSIS_REQUEST: [
    'INTENT_ARCHITECTURE',
    'EVIDENCE_REGISTRY',
    'CENTRAL_BRAIN',
    'TRUST_ENGINE',
    'TIMELINE_LEDGER',
    'PROJECT_VAULT',
  ],
  PROJECT_REQUEST: ['INTENT_ARCHITECTURE', 'PROJECT_VAULT', 'CENTRAL_BRAIN'],
  INFORMATION_REQUEST: ['INTENT_ARCHITECTURE', 'CENTRAL_BRAIN', 'PROJECT_VAULT'],
  UNKNOWN: ['INTENT_ARCHITECTURE', 'CENTRAL_BRAIN'],
};

export function getIntentContextRequirements(intentType: IntentType): ContextSource[] {
  return [...INTENT_REQUIREMENTS[intentType]];
}

export function mapIntentToContextPriority(
  intentType: IntentType,
  source: ContextSource,
): ContextPriority {
  return INTENT_PRIORITY_MAP[intentType][source] ?? 'IGNORE';
}

/** Read latest intent summary without mutating Intent Architecture records. */
export function readLatestIntentTypeForArbitration(): IntentType | null {
  const summary = getLatestIntentSummary();
  return summary?.intentType ?? null;
}

export function assertIntentArchitectureOwnershipUnchanged(): boolean {
  const authority = getDevPulseV2IntentArchitectureAuthority();
  return (
    authority.constructor.name === 'DevPulseV2IntentArchitectureAuthority' &&
    typeof authority.extractAndStoreIntent === 'function' &&
    typeof (authority as { arbitrateContext?: unknown }).arbitrateContext === 'undefined'
  );
}

export function getIntentArchitectureOwnerForBridge(): string {
  return INTENT_OWNER_MODULE;
}
