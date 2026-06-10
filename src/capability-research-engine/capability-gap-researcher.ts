/**
 * Capability Research Engine — capability gap researcher.
 */

import type {
  CapabilityGapResearchResult,
  CapabilityGapType,
  CapabilityResearchInput,
  DomainClassificationResult,
} from './capability-research-types.js';
import type { CapabilityEvidenceResult } from './capability-research-types.js';

export function researchCapabilityGap(
  input: CapabilityResearchInput,
  domain: DomainClassificationResult,
  evidence: CapabilityEvidenceResult,
): CapabilityGapResearchResult {
  const proposed = (input.proposedCapability ?? '').toLowerCase();
  const findings: string[] = [];
  let gapType: CapabilityGapType = 'NO_GAP';
  let confidence = 20;

  if (evidence.evidenceCount === 0 && !input.escalationDecision) {
    return { gapType: 'NO_GAP', findings: ['insufficient evidence for gap'], confidence: 15 };
  }

  if (input.escalationDecision === 'CAPABILITY_GAP_DETECTED' || input.escalationDecision === 'RESEARCH_REQUIRED') {
    gapType = 'MISSING_CAPABILITY';
    confidence = 70;
    findings.push('escalation indicates missing capability');
  } else if (evidence.evidenceQualityScore >= 60 && evidence.evidenceCount >= 3) {
    gapType = 'MISSING_CAPABILITY';
    confidence = 65;
    findings.push('strong multi-source evidence supports missing capability');
  } else if (evidence.evidenceQualityScore >= 30 && evidence.evidenceCount >= 2) {
    gapType = 'INCOMPLETE_CAPABILITY';
    confidence = 55;
    findings.push('partial evidence suggests incomplete capability');
  } else if (evidence.evidenceCount >= 1) {
    gapType = 'WEAK_CAPABILITY';
    confidence = 45;
    findings.push('limited evidence suggests weak existing capability');
  }

  if (proposed.includes('optimizer') || proposed.includes('performance')) {
    gapType = gapType === 'NO_GAP' ? 'INCOMPLETE_CAPABILITY' : gapType;
    findings.push('performance optimizer may be incomplete');
    confidence = Math.max(confidence, 50);
  }

  const diagnosticSignal = proposed.includes('diagnostic')
    || (domain.domain === 'DIAGNOSTICS' && domain.confidence > 25);
  if (diagnosticSignal && evidence.evidenceCount > 0) {
    gapType = 'MISSING_CAPABILITY';
    findings.push('diagnostic capability gap suspected');
    confidence = Math.max(confidence, 60);
  }

  if (proposed.includes('recovery')) {
    findings.push('recovery mechanism may be missing or weak');
    gapType = gapType === 'NO_GAP' ? 'WEAK_CAPABILITY' : gapType;
    confidence = Math.max(confidence, 50);
  }

  return { gapType, findings, confidence: Math.min(100, confidence) };
}
