/**
 * Product Experience Verification Engine — experience gap analyzer.
 */

import type {
  ExperienceGap,
  ExperienceGapAnalysis,
  FounderExperienceVerification,
  IntelligenceContinuityVerification,
  LaunchReadinessContinuityVerification,
  NavigationContinuityVerification,
  ProductCoherenceVerification,
  ProductIdentityContinuityVerification,
  TrustContinuityVerification,
  VerificationContinuityVerification,
  WorkflowContinuityVerification,
} from './product-experience-types.js';
import type { ExperienceContinuityVerification } from './product-experience-types.js';
import { EXPERIENCE_GAP_ANALYSIS_PASS, MAX_EXPERIENCE_GAPS } from './product-experience-types.js';
import { mergeBoundedGaps } from './experience-gap-model.js';
import { getCachedGapAnalysis, setCachedGapAnalysis } from './product-experience-cache.js';

export interface VerifierGapInputs {
  coherence: ProductCoherenceVerification;
  experience: ExperienceContinuityVerification;
  intelligence: IntelligenceContinuityVerification;
  workflow: WorkflowContinuityVerification;
  navigation: NavigationContinuityVerification;
  verification: VerificationContinuityVerification;
  founder: FounderExperienceVerification;
  trust: TrustContinuityVerification;
  identity: ProductIdentityContinuityVerification;
  launch: LaunchReadinessContinuityVerification;
}

let gapAnalysisCount = 0;

const CROSS_SYSTEM_PATTERNS: Array<{ check: (gaps: ExperienceGap[]) => boolean; message: string }> = [
  {
    check: (gaps) => gaps.some((g) => g.description.includes('no next action') || g.detectionCode === 'WORKFLOW_DEAD_END'),
    message: 'Report generated but no next action',
  },
  {
    check: (gaps) => gaps.some((g) => g.description.includes('Preview') && g.detectionCode === 'VERIFICATION_DISCONNECTION'),
    message: 'Preview available but disconnected from verification',
  },
  {
    check: (gaps) => gaps.some((g) => g.connectedSystems.includes('Operator Feed') && g.detectionCode === 'EXPERIENCE_BREAK'),
    message: 'Operator Feed disconnected from workflow',
  },
  {
    check: (gaps) => gaps.some((g) => g.connectedSystems.includes('Chat') && g.detectionCode === 'INTELLIGENCE_FRAGMENTATION'),
    message: 'Chat disconnected from recommendations',
  },
];

export function analyzeExperienceGaps(requestId: string, verifiers: VerifierGapInputs): ExperienceGapAnalysis {
  const cacheKey = [
    requestId,
    verifiers.coherence.continuityScore,
    verifiers.workflow.continuityScore,
    verifiers.verification.continuityScore,
  ].join('|');
  const cached = getCachedGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      verifiers.coherence.gaps,
      verifiers.experience.gaps,
      verifiers.intelligence.gaps,
      verifiers.workflow.gaps,
      verifiers.navigation.gaps,
      verifiers.verification.gaps,
      verifiers.founder.gaps,
      verifiers.trust.gaps,
      verifiers.identity.gaps,
      verifiers.launch.gaps,
    ],
    MAX_EXPERIENCE_GAPS,
  );

  const criticalGaps = gaps.filter((g) => g.severity === 'CRITICAL');
  const crossSystemDisconnections = CROSS_SYSTEM_PATTERNS
    .filter((p) => p.check(gaps))
    .map((p) => p.message);

  const result: ExperienceGapAnalysis = {
    gaps,
    criticalGaps,
    crossSystemDisconnections,
    passToken: EXPERIENCE_GAP_ANALYSIS_PASS,
  };
  setCachedGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetExperienceGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
