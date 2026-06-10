/**
 * Autonomous Verification — decision builder pipeline.
 */

import { analyzeVerificationEvidence } from './evidence-analyzer.js';
import { analyzeVerificationTrust } from './verification-trust-analyzer.js';
import { analyzeVerificationRisk } from './verification-risk-analyzer.js';
import { analyzeVerificationConfidence } from './verification-confidence-analyzer.js';
import { evaluateVerificationReadiness } from './verification-readiness-evaluator.js';
import { selectVerificationDecision } from './verification-strategy-selector.js';
import type { AutonomousVerificationResult, VerificationInput } from './autonomous-verification-types.js';

let resultCounter = 0;

export function buildVerificationDecision(input: VerificationInput): AutonomousVerificationResult {
  const reasoning: string[] = [];

  const evidence = analyzeVerificationEvidence(input);
  reasoning.push(`Evidence types: ${evidence.evidenceTypes.join(', ') || 'none'}`);
  reasoning.push(`Evidence confidence: ${evidence.evidenceConfidence}`);

  const trustScore = analyzeVerificationTrust(input, evidence);
  reasoning.push(`Trust score: ${trustScore}`);

  const riskScore = analyzeVerificationRisk(input, evidence, trustScore);
  reasoning.push(`Risk score: ${riskScore}`);

  const confidence = analyzeVerificationConfidence(input, evidence, trustScore, riskScore);
  reasoning.push(`Verification confidence: ${confidence}`);

  const decision = selectVerificationDecision(input, evidence, trustScore, riskScore, confidence);
  reasoning.push(`Decision: ${decision}`);

  const readiness = evaluateVerificationReadiness(
    input,
    decision,
    evidence,
    trustScore,
    riskScore,
    confidence,
  );
  reasoning.push(`Readiness: ${readiness}`);

  if (evidence.missingEvidence.length > 0) {
    reasoning.push(`Missing evidence: ${evidence.missingEvidence.join(', ')}`);
  }

  resultCounter += 1;

  return {
    id: `verification-result-${resultCounter}`,
    decision,
    confidence,
    trustScore,
    riskScore,
    evidenceTypes: evidence.evidenceTypes,
    evidenceSummary: evidence.evidenceSummary,
    reasoning,
    generatedAt: Date.now(),
  };
}

export function resetVerificationDecisionCounterForTests(): void {
  resultCounter = 0;
}
