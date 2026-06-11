/**
 * Reality-Proof Authority Report Builder.
 */

import { REALITY_PROOF_REPORT_TITLE } from './reality-proof-bounds.js';
import type { RealityProofAssessment, RealityProofCategory, RealityEvidenceLevel } from './reality-proof-types.js';

const CATEGORY_LABELS: Record<RealityProofCategory, string> = {
  EXECUTION_PROOF: 'Execution Proof',
  USER_PROOF: 'User Proof',
  INTERACTION_PROOF: 'User Proof',
  VERIFICATION_PROOF: 'Verification Proof',
  RUNTIME_PROOF: 'Runtime Proof',
  LAUNCH_PROOF: 'Launch Proof',
};

function sectionForCategories(
  assessment: RealityProofAssessment,
  categories: RealityProofCategory[],
): string {
  const findings = assessment.findings.filter((finding) => categories.includes(finding.category));
  if (!findings.length) return 'None evaluated.\n';
  return findings
    .map(
      (finding) =>
        `- **${finding.finding}** [${finding.evidenceLevel}]\n` +
        `  Evidence: ${finding.evidence.join('; ') || 'None'}\n` +
        `  Risk: ${finding.risk}\n` +
        `  Recommendation: ${finding.recommendation}`,
    )
    .join('\n');
}

function sectionForLevel(assessment: RealityProofAssessment, level: RealityEvidenceLevel): string {
  const findings = assessment.findings.filter((finding) => finding.evidenceLevel === level);
  if (!findings.length) return '- None recorded.\n';
  return findings.map((finding) => `- **${finding.finding}** (${finding.category})`).join('\n');
}

export function buildRealityProofReportMarkdown(
  assessment: RealityProofAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'REALITY_PROVEN'
      ? 'Launch conclusions are mostly supported by proven or observed reality.'
      : assessment.readinessState === 'BLOCKED'
        ? 'Reality proof is insufficient — launch claims exceed what runtime evidence supports.'
        : assessment.readinessState === 'ASSUMPTION_HEAVY'
          ? 'Too much launch evidence is assumed or inferred rather than proven.'
          : 'Reality proof is partial — assumptions and unknowns remain material.';

  return `# ${REALITY_PROOF_REPORT_TITLE}

Generated: ${date}
Reality versus assumption evaluation — evidence classification only

## Reality Proof Summary

Reality proof score: **${assessment.realityProofScore}/100**

Reality risk score: **${assessment.realityRiskScore}/100**

Proven reality: **${assessment.provenRealityCount}**

Observed reality: **${assessment.observedRealityCount}**

Inferred reality: **${assessment.inferredRealityCount}**

Assumed reality: **${assessment.assumedRealityCount}**

Unknown reality: **${assessment.unknownRealityCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **How much of this launch recommendation is based on reality versus assumption?**

## Execution Proof

${sectionForCategories(assessment, ['EXECUTION_PROOF'])}

## Runtime Proof

${sectionForCategories(assessment, ['RUNTIME_PROOF'])}

## User Proof

${sectionForCategories(assessment, ['USER_PROOF', 'INTERACTION_PROOF'])}

## Verification Proof

${sectionForCategories(assessment, ['VERIFICATION_PROOF'])}

## Launch Proof

${sectionForCategories(assessment, ['LAUNCH_PROOF'])}

## Assumption Risks

${sectionForLevel(assessment, 'ASSUMED_REALITY')}

## Unknown Areas

${sectionForLevel(assessment, 'UNKNOWN_REALITY')}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If reality did not prove it, the system must not claim it is proven.'}

## Reality Proof Verdict

${verdict}
`;
}
