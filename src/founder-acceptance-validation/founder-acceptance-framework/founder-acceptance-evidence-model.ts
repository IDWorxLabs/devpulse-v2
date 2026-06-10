/**
 * Founder Acceptance Framework — founder acceptance evidence model.
 */

import type { FounderAcceptanceEvidenceModel } from './founder-acceptance-types.js';
import { EVIDENCE_MODEL_PASS } from './founder-acceptance-types.js';
import { getCachedEvidenceModel, setCachedEvidenceModel } from './founder-acceptance-cache.js';

let evidenceModelBuilds = 0;

const EVIDENCE_SLOTS = [
  {
    sourceId: 'PRODUCT_REALITY_VERIFICATION' as const,
    sourceName: 'Product Reality Verification',
    description: 'Product reality orchestrator verdict, blockers, and aggregate scores',
    evidenceTypes: ['PRODUCT_REALITY_REPORT', 'PRODUCT_REALITY_VERDICT', 'LAUNCH_BLOCKERS'],
    futurePhase: '24.7.8 (available)',
    available: true,
  },
  {
    sourceId: 'FOUNDER_WORKFLOW_VALIDATION' as const,
    sourceName: 'Founder Workflow Validation',
    description: 'Founder daily workflow continuity and operational path validation',
    evidenceTypes: ['WORKFLOW_ACCEPTANCE_EVIDENCE', 'WORKFLOW_BREAKS'],
    futurePhase: '24.8.2',
    available: false,
  },
  {
    sourceId: 'FOUNDER_CONFIDENCE_ENGINE' as const,
    sourceName: 'Founder Confidence Engine',
    description: 'Founder confidence in recommendations and readiness claims',
    evidenceTypes: ['CONFIDENCE_SCORE', 'CONFIDENCE_RISKS'],
    futurePhase: '24.8.3',
    available: false,
  },
  {
    sourceId: 'FOUNDER_TRUST_VALIDATION' as const,
    sourceName: 'Founder Trust Validation',
    description: 'Trust signal continuity and honesty verification',
    evidenceTypes: ['TRUST_SCORE', 'TRUST_GAPS'],
    futurePhase: '24.8.4',
    available: false,
  },
  {
    sourceId: 'FOUNDER_PRODUCTIVITY_VALIDATION' as const,
    sourceName: 'Founder Productivity Validation',
    description: 'Operational productivity and friction assessment',
    evidenceTypes: ['PRODUCTIVITY_SCORE', 'FRICTION_EVENTS'],
    futurePhase: '24.8.5',
    available: false,
  },
  {
    sourceId: 'FOUNDER_FRICTION_DETECTOR' as const,
    sourceName: 'Founder Friction Detector',
    description: 'Detected founder friction points and resolution paths',
    evidenceTypes: ['FRICTION_REPORT', 'FRICTION_HOTSPOTS'],
    futurePhase: '24.8.6',
    available: false,
  },
  {
    sourceId: 'FOUNDER_READINESS_AUTHORITY' as const,
    sourceName: 'Founder Readiness Authority',
    description: 'Founder launch and operational readiness authority',
    evidenceTypes: ['READINESS_VERDICT', 'READINESS_GAPS'],
    futurePhase: '24.8.7',
    available: false,
  },
  {
    sourceId: 'FUTURE_FOUNDER_REPORTS' as const,
    sourceName: 'Future Founder Reports',
    description: 'Aggregated founder acceptance reports from full 24.8 stack',
    evidenceTypes: ['FOUNDER_ACCEPTANCE_REPORT', 'FOUNDER_ACCEPTANCE_VERDICT'],
    futurePhase: '24.8.8',
    available: false,
  },
];

export function buildFounderAcceptanceEvidenceModel(requestId: string): FounderAcceptanceEvidenceModel {
  const cacheKey = `evidence-${requestId}`;
  const cached = getCachedEvidenceModel(cacheKey);
  if (cached) return cached;

  evidenceModelBuilds += 1;
  const result: FounderAcceptanceEvidenceModel = {
    evidenceSlots: [...EVIDENCE_SLOTS],
    passToken: EVIDENCE_MODEL_PASS,
  };
  setCachedEvidenceModel(cacheKey, result);
  return result;
}

export function getEvidenceModelBuilds(): number {
  return evidenceModelBuilds;
}

export function resetFounderAcceptanceEvidenceModelForTests(): void {
  evidenceModelBuilds = 0;
}
