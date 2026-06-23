/**
 * Founder flow failure classifier — founder flow truth rules (Phase 26.86).
 */

import type {
  DiscoveredFounderFlowCandidate,
  FounderFlowFailureClass,
  FounderFlowProbeResult,
  FounderFlowResultStoreCheck,
} from './founder-flow-runtime-proof-types.js';

export interface FounderFlowClassification {
  readOnly: true;
  failureClass: FounderFlowFailureClass;
  founderFlowProven: boolean;
  founderFlowFailureReason: string;
}

export function classifyFounderFlow(input: {
  uiRendersBeforeProbe: boolean;
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  filesExistOnDisk: boolean;
  dependenciesReady: boolean;
  discoveredCandidates: readonly DiscoveredFounderFlowCandidate[];
  flowProbe: FounderFlowProbeResult;
  resultStoreCheck: FounderFlowResultStoreCheck;
}): FounderFlowClassification {
  if (!input.uiRendersBeforeProbe) {
    return {
      readOnly: true,
      failureClass: 'UI_RENDER_NOT_READY',
      founderFlowProven: false,
      founderFlowFailureReason: 'Founder flow proof requires UI Render Proof with uiRenders=true.',
    };
  }

  if (!input.flowProbe.founderRuntimeOpen) {
    return {
      readOnly: true,
      failureClass: 'FLOW_START_NOT_PROVEN',
      founderFlowProven: false,
      founderFlowFailureReason: 'Founder-facing runtime is not open — startup or route proof incomplete.',
    };
  }

  if (!input.flowProbe.uiLoadedAsApp) {
    return {
      readOnly: true,
      failureClass: 'FLOW_START_NOT_PROVEN',
      founderFlowProven: false,
      founderFlowFailureReason: 'Generated UI did not load as a user-facing application.',
    };
  }

  if (input.flowProbe.interactiveScan.interactiveElementCount === 0 && !input.flowProbe.flowStartProven) {
    return {
      readOnly: true,
      failureClass: 'NO_INTERACTIVE_ELEMENTS',
      founderFlowProven: false,
      founderFlowFailureReason: 'UI HTML loaded but no interactive elements detected for founder flow.',
    };
  }

  const chainReady =
    input.filesExistOnDisk &&
    input.dependenciesReady &&
    input.applicationBootsBeforeProbe &&
    input.routesReachableBeforeProbe &&
    input.uiRendersBeforeProbe;

  if (input.resultStoreCheck.finalResultDelivered && chainReady) {
    if (!input.resultStoreCheck.evidencePropagationAligned) {
      return {
        readOnly: true,
        failureClass: 'EVIDENCE_PROPAGATION_FAILURE',
        founderFlowProven: false,
        founderFlowFailureReason:
          'Final result delivered but runtime bridge founderFlow evidence does not reflect delivery.',
      };
    }
    return {
      readOnly: true,
      failureClass: 'FOUNDER_FLOW_PROVEN',
      founderFlowProven: true,
      founderFlowFailureReason:
        'UI renders and final result/report delivered to result store or client cache (Rule 1).',
    };
  }

  if (input.resultStoreCheck.reportGenerated && input.resultStoreCheck.partialReportOnly) {
    return {
      readOnly: true,
      failureClass: 'REPORT_GENERATED_NOT_DELIVERED',
      founderFlowProven: false,
      founderFlowFailureReason:
        'Partial or preparing report observed — does not count as final client delivery (Rules 3–4).',
    };
  }

  if (input.resultStoreCheck.reportGenerated && !input.resultStoreCheck.finalResultDelivered) {
    return {
      readOnly: true,
      failureClass: 'REPORT_GENERATED_NOT_DELIVERED',
      founderFlowProven: false,
      founderFlowFailureReason: 'Report generation observed but final client delivery missing (Rule 3).',
    };
  }

  if (!input.resultStoreCheck.resultStorePresent && !input.resultStoreCheck.clientCacheUpdated) {
    return {
      readOnly: true,
      failureClass: 'RESULT_STORE_MISSING',
      founderFlowProven: false,
      founderFlowFailureReason: 'No founder test run result in store and client cache not updated.',
    };
  }

  if (input.resultStoreCheck.resultStorePresent && !input.resultStoreCheck.finalResultDelivered) {
    return {
      readOnly: true,
      failureClass: 'FINAL_RESULT_NOT_DELIVERED',
      founderFlowProven: false,
      founderFlowFailureReason: 'UI renders but final result/report was not delivered (Rule 2).',
    };
  }

  if (!input.resultStoreCheck.resultEndpointRegistered) {
    return {
      readOnly: true,
      failureClass: 'RESULT_ENDPOINT_UNREACHABLE',
      founderFlowProven: false,
      founderFlowFailureReason: 'Expected founder result endpoints not registered.',
    };
  }

  if (input.resultStoreCheck.clientCacheUpdated === false && input.resultStoreCheck.finalResultDelivered) {
    return {
      readOnly: true,
      failureClass: 'CLIENT_CACHE_NOT_UPDATED',
      founderFlowProven: false,
      founderFlowFailureReason: 'Final report exists in store but client cache was not updated.',
    };
  }

  if (!input.flowProbe.flowStartProven) {
    return {
      readOnly: true,
      failureClass: 'FLOW_COMPLETION_NOT_PROVEN',
      founderFlowProven: false,
      founderFlowFailureReason: 'Critical flow start not proven and completion not observed.',
    };
  }

  return {
    readOnly: true,
    failureClass: 'FINAL_RESULT_NOT_DELIVERED',
    founderFlowProven: false,
    founderFlowFailureReason: 'UI renders but founder-critical workflow did not complete with final delivery.',
  };
}
