/**
 * Capability Research Engine — decision pipeline.
 */

import type {
  CapabilityResearchDecision,
  CapabilityResearchInput,
  CapabilityResearchRecord,
} from './capability-research-types.js';
import { classifyCapabilityDomain } from './capability-domain-classifier.js';
import { analyzeCapabilityEvidence } from './capability-evidence-analyzer.js';
import { researchCapabilityGap } from './capability-gap-researcher.js';
import { analyzeCapabilitySimilarity } from './capability-similarity-analyzer.js';
import { researchCapabilityRootCause } from './capability-root-cause-researcher.js';
import { registerCapabilityResearch } from './capability-research-registry.js';
import { generateCapabilityResearchReport } from './capability-research-reporting.js';
import { recordCapabilityResearchHistory } from './capability-research-history.js';
import { getCachedResearchDecision, setCachedResearchDecision } from './capability-research-cache.js';

let researchDecisionCount = 0;
let researchCounter = 0;

export interface CapabilityResearchDecisionResult {
  record: CapabilityResearchRecord;
  report: ReturnType<typeof generateCapabilityResearchReport>;
}

export function buildCapabilityResearchDecision(input: CapabilityResearchInput): CapabilityResearchDecisionResult {
  const cacheKey = JSON.stringify({
    p: input.proposedCapability ?? '',
    s: input.subsystem ?? '',
    f: input.failures?.length ?? 0,
    st: input.stalls?.length ?? 0,
    b: input.bottlenecks?.length ?? 0,
    bs: input.blockedStates?.length ?? 0,
    e: input.escalationDecision ?? '',
  });

  const domain = classifyCapabilityDomain(input);
  const evidence = analyzeCapabilityEvidence(input);
  const gapResearch = researchCapabilityGap(input, domain, evidence);
  const similarity = analyzeCapabilitySimilarity(input);
  const rootCause = researchCapabilityRootCause(input, evidence, gapResearch);

  let decision: CapabilityResearchDecision;

  const cachedDecision = getCachedResearchDecision(cacheKey);
  if (cachedDecision) {
    decision = cachedDecision;
  } else {
    if (similarity.duplicateRisk === 'DUPLICATE' || similarity.duplicateRisk === 'HIGH') {
      decision = 'EXISTING_CAPABILITY_INSUFFICIENT';
    } else if (evidence.evidenceCount === 0 && gapResearch.gapType === 'NO_GAP') {
      decision = 'NO_GAP_FOUND';
    } else if (
      (input.proposedCapability ?? '').toLowerCase().includes('diagnostic')
      || (domain.domain === 'DIAGNOSTICS' && domain.confidence > 25)
    ) {
      decision = 'DIAGNOSTIC_REQUIRED';
    } else if (
      (input.proposedCapability ?? '').toLowerCase().includes('optimizer')
      || (domain.domain === 'PERFORMANCE' && domain.confidence > 25)
    ) {
      decision = 'OPTIMIZATION_REQUIRED';
    } else if (gapResearch.gapType === 'MISSING_CAPABILITY' && similarity.duplicateRisk === 'NONE') {
      decision = 'NEW_CAPABILITY_REQUIRED';
    } else if (gapResearch.gapType === 'WEAK_CAPABILITY' || gapResearch.gapType === 'INCOMPLETE_CAPABILITY') {
      decision = 'EXISTING_CAPABILITY_INSUFFICIENT';
    } else if (evidence.evidenceConfidence < 30) {
      decision = 'RESEARCH_INCONCLUSIVE';
    } else if (rootCause.rootCause === 'MISSING_CAPABILITY') {
      decision = 'NEW_CAPABILITY_REQUIRED';
    } else {
      decision = 'NO_GAP_FOUND';
    }
    setCachedResearchDecision(cacheKey, decision);
  }

  researchDecisionCount += 1;
  researchCounter += 1;

  const record: CapabilityResearchRecord = {
    researchId: `research-${researchCounter}`,
    capabilityDomain: domain.domain,
    decision,
    confidence: Math.round((evidence.evidenceConfidence + gapResearch.confidence + rootCause.confidence) / 3),
    evidenceCount: evidence.evidenceCount,
    createdAt: Date.now(),
  };

  registerCapabilityResearch(record);
  const report = generateCapabilityResearchReport(record, {
    domain,
    evidence,
    gapResearch,
    similarity,
    rootCause,
  });
  recordCapabilityResearchHistory(record);

  return { record, report };
}

export function getResearchDecisionCount(): number {
  return researchDecisionCount;
}

export function resetResearchDecisionEngineForTests(): void {
  researchDecisionCount = 0;
  researchCounter = 0;
}
