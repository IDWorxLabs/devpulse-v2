/**
 * Launch Blocker Analyzer — identify hard launch blockers from upstream evidence.
 */

import type {
  AutonomousBuildExecutionProofReport,
  ExecutionStageId,
} from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { CHAT_LAUNCH_BLOCK_THRESHOLD } from './connected-launch-readiness-proof-registry.js';
import type {
  LaunchBlockerAssessment,
  LaunchBlockerEntry,
  LaunchReadinessFixture,
} from './connected-launch-readiness-proof-types.js';

function blocker(
  blockerId: string,
  blockerTitle: string,
  blockerReason: string,
  severity: LaunchBlockerEntry['severity'],
  sourceAuthority: string,
  recommendedFix: string,
): LaunchBlockerEntry {
  return {
    readOnly: true,
    blockerId,
    blockerTitle,
    blockerReason,
    severity,
    sourceAuthority,
    message: blockerReason,
    recommendedFix,
  };
}

export function analyzeLaunchBlockers(input: {
  executionProof: AutonomousBuildExecutionProofReport | null;
  coreChainConnected?: boolean;
  coreFirstBrokenStage?: ExecutionStageId | null;
  verificationProof: VerificationExecutionProofReport | null;
  productReadiness: ProductReadinessReport | null;
  chatStress: ChatStressSimulationReport | null;
  founderTest: FounderTestAssessment | null;
  launchCouncil: LaunchCouncilAssessment | null;
  founderAcceptance: FounderAcceptanceAssessment | null;
  connectedExecutionChainProven?: boolean;
  fixture?: LaunchReadinessFixture;
}): LaunchBlockerAssessment {
  if (input.fixture?.suppressBlockers) {
    return {
      readOnly: true,
      blockers: [],
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }

  const blockers: LaunchBlockerEntry[] = [];
  const executionChainProven = input.connectedExecutionChainProven === true;

  const chainConnected =
    executionChainProven ||
    input.executionProof?.chainConnected ||
    input.coreChainConnected ||
    false;
  const firstBrokenStage =
    input.executionProof?.firstBrokenStage ?? input.coreFirstBrokenStage ?? null;

  if (!chainConnected && !executionChainProven) {
    blockers.push(
      blocker(
        'execution-chain-disconnected',
        'Execution chain disconnected',
        `Execution chain disconnected — first break at ${firstBrokenStage ?? 'unknown'}`,
        'CRITICAL',
        'autonomous-build-execution-proof',
        input.executionProof?.recommendedFix ?? 'Prove connected execution chain through VERIFY.',
      ),
    );
  }

  if (
    !executionChainProven &&
    input.verificationProof?.verificationProofLevel !== 'PROVEN'
  ) {
    blockers.push(
      blocker(
        'verification-not-proven',
        'Verification not proven',
        `Verification proof level: ${input.verificationProof?.verificationProofLevel ?? 'NOT_ASSESSED'}`,
        'CRITICAL',
        'connected-verification-execution-proof',
        input.verificationProof?.recommendedFix ?? 'Prove verification execution with evidence artifacts.',
      ),
    );
  }

  const faState = input.founderAcceptance?.acceptanceState;
  if (faState === 'BLOCKED' && !executionChainProven) {
    blockers.push(
      blocker(
        'founder-acceptance-rejected',
        'Founder acceptance rejected',
        `Founder acceptance state: ${faState}`,
        'CRITICAL',
        'founder-acceptance-gate',
        'Resolve founder acceptance blockers before launch.',
      ),
    );
  } else if (!executionChainProven && faState === 'NOT_ACCEPTED') {
    blockers.push(
      blocker(
        'founder-acceptance-rejected',
        'Founder acceptance not accepted',
        `Founder acceptance state: ${faState}`,
        'CRITICAL',
        'founder-acceptance-gate',
        'Resolve founder acceptance blockers before launch.',
      ),
    );
  }

  if (input.productReadiness?.launchBlocked) {
    blockers.push(
      blocker(
        'product-readiness-blocked',
        'Product readiness blocked',
        `Product readiness ${input.productReadiness.readinessScore}/100 — ${input.productReadiness.verdict}`,
        'CRITICAL',
        'product-readiness-simulation',
        input.productReadiness.selfEvolution.whatShouldWeBuildNext[0] ??
          'Fix product readiness simulation blockers.',
      ),
    );
  }

  if (input.chatStress?.chatBlocksLaunchReadiness) {
    blockers.push(
      blocker(
        'chat-stress-blocks-launch',
        'Chat stress blocks launch',
        `Chat score ${input.chatStress.overallScore}/100 below threshold ${CHAT_LAUNCH_BLOCK_THRESHOLD}`,
        input.chatStress.overallScore < 70 ? 'CRITICAL' : 'HIGH',
        'chat-stress-simulation',
        input.chatStress.recommendedNextChatImprovements[0] ?? 'Improve chat stress simulation scores.',
      ),
    );
  }

  if (input.launchCouncil && input.launchCouncil.launchBlockerCount > 0) {
    blockers.push(
      blocker(
        'launch-council-blockers',
        'Launch Council blockers',
        `Launch Council: ${input.launchCouncil.launchBlockerCount} blocker(s), readiness ${input.launchCouncil.readinessState}`,
        input.launchCouncil.readinessState === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
        'launch-council',
        input.launchCouncil.recommendations[0] ?? 'Resolve Launch Council blockers.',
      ),
    );
  }

  if (
    input.founderTest &&
    input.founderTest.verdict === 'NOT_FOUNDER_READY' &&
    !executionChainProven
  ) {
    blockers.push(
      blocker(
        'founder-test-not-ready',
        'Founder test not ready',
        `Founder test verdict: ${input.founderTest.verdict}`,
        'HIGH',
        'founder-test-integration',
        'Improve founder test portfolio scores before launch.',
      ),
    );
  }

  return {
    readOnly: true,
    blockers,
    criticalCount: blockers.filter((b) => b.severity === 'CRITICAL').length,
    highCount: blockers.filter((b) => b.severity === 'HIGH').length,
    mediumCount: blockers.filter((b) => b.severity === 'MEDIUM').length,
    lowCount: blockers.filter((b) => b.severity === 'LOW').length,
  };
}

export function hasCriticalBlockers(assessment: LaunchBlockerAssessment): boolean {
  return assessment.criticalCount > 0;
}
