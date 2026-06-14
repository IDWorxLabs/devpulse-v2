/**
 * Launch Acceptance Analyzer — aggregate founder-facing acceptance signals.
 */

import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import type {
  LaunchAcceptanceAssessment,
  LaunchAcceptanceState,
  LaunchReadinessFixture,
} from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchAcceptance(input: {
  founderAcceptance: FounderAcceptanceAssessment | null;
  founderTest: FounderTestAssessment | null;
  productReadiness: ProductReadinessReport | null;
  launchCouncil: LaunchCouncilAssessment | null;
  connectedExecutionChainProven?: boolean;
  fixture?: LaunchReadinessFixture;
}): LaunchAcceptanceAssessment {
  if (input.fixture?.forceAcceptanceState) {
    return {
      readOnly: true,
      acceptanceState: input.fixture.forceAcceptanceState,
      acceptanceReasons: [`Fixture override: ${input.fixture.forceAcceptanceState}`],
      confidence: 90,
    };
  }

  const reasons: string[] = [];
  let acceptanceState: LaunchAcceptanceState = 'CONDITIONAL';

  if (input.connectedExecutionChainProven) {
    acceptanceState = 'ACCEPTED';
    reasons.push('Connected execution chain proven through VERIFY');
  }

  const fa = input.founderAcceptance?.acceptanceState;
  if (fa === 'ACCEPTED') {
    acceptanceState = 'ACCEPTED';
    reasons.push('Founder acceptance: ACCEPTED');
  } else if (fa === 'ACCEPTED_WITH_WARNINGS') {
    acceptanceState = 'CONDITIONAL';
    reasons.push('Founder acceptance: ACCEPTED_WITH_WARNINGS');
  } else if (fa === 'NOT_ACCEPTED' || fa === 'BLOCKED') {
    if (!input.connectedExecutionChainProven) {
      acceptanceState = 'REJECTED';
      reasons.push(`Founder acceptance: ${fa}`);
    } else {
      reasons.push(
        `Founder acceptance: ${fa} — execution chain proven; launch proof uses connected evidence`,
      );
    }
  } else if (fa === 'INSUFFICIENT_EVIDENCE') {
    acceptanceState = 'CONDITIONAL';
    reasons.push('Founder acceptance: INSUFFICIENT_EVIDENCE');
  }

  if (input.connectedExecutionChainProven && acceptanceState !== 'REJECTED') {
    if (acceptanceState === 'CONDITIONAL') acceptanceState = 'ACCEPTED';
  }

  const verdict = input.founderTest?.verdict;
  if (verdict === 'FOUNDER_READY') {
    reasons.push('Founder test: FOUNDER_READY');
    if (acceptanceState !== 'REJECTED') acceptanceState = 'ACCEPTED';
  } else if (verdict === 'FOUNDER_READY_WITH_WARNINGS') {
    reasons.push('Founder test: FOUNDER_READY_WITH_WARNINGS');
    if (acceptanceState === 'ACCEPTED') acceptanceState = 'CONDITIONAL';
  } else if (verdict === 'NOT_FOUNDER_READY') {
    if (input.connectedExecutionChainProven) {
      reasons.push(
        'Founder test: NOT_FOUNDER_READY — execution chain proven; launch proof uses connected evidence',
      );
      if (acceptanceState !== 'REJECTED') acceptanceState = 'CONDITIONAL';
    } else {
      acceptanceState = 'REJECTED';
      reasons.push('Founder test: NOT_FOUNDER_READY');
    }
  }

  if (input.connectedExecutionChainProven && acceptanceState !== 'REJECTED') {
    reasons.push('Connected execution chain proven through VERIFY');
    if (acceptanceState === 'CONDITIONAL') {
      acceptanceState = 'ACCEPTED';
    }
  }

  if (input.launchCouncil?.readinessState === 'BLOCKED') {
    acceptanceState = 'REJECTED';
    reasons.push('Launch Council: BLOCKED');
  } else if (input.launchCouncil?.readinessState === 'CAUTION' && acceptanceState === 'ACCEPTED') {
    acceptanceState = 'CONDITIONAL';
    reasons.push('Launch Council: CAUTION');
  }

  if (input.productReadiness?.launchBlocked) {
    if (acceptanceState !== 'REJECTED') acceptanceState = 'CONDITIONAL';
    reasons.push('Product readiness simulation blocks launch');
  }

  return {
    readOnly: true,
    acceptanceState,
    acceptanceReasons: reasons,
    confidence: acceptanceState === 'ACCEPTED' ? 88 : acceptanceState === 'REJECTED' ? 85 : 65,
  };
}

export function isAcceptanceRejected(state: LaunchAcceptanceState): boolean {
  return state === 'REJECTED';
}
