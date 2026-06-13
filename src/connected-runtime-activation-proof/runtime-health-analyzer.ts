/**
 * Runtime Health Analyzer — verify application health from observed responses.
 */

import type {
  RuntimeHealthAssessment,
  RuntimeHealthState,
  RuntimePortAssessment,
  RuntimeSessionEvidence,
} from './connected-runtime-activation-proof-types.js';

function deriveHealthState(input: {
  statusCode: number | null;
  responseType: RuntimeHealthAssessment['responseType'];
  portReachable: boolean;
}): RuntimeHealthState {
  if (!input.portReachable && input.statusCode === null) return 'NOT_CHECKED';
  if (input.statusCode !== null && input.statusCode >= 500) return 'FAILED';
  if (input.statusCode !== null && input.statusCode >= 200 && input.statusCode < 400) {
    return input.responseType ? 'HEALTHY' : 'PARTIAL';
  }
  if (input.portReachable && input.statusCode === null) return 'PARTIAL';
  if (input.statusCode !== null) return 'FAILED';
  return 'NOT_CHECKED';
}

export function analyzeRuntimeHealth(input: {
  port: RuntimePortAssessment;
  sessionEvidence?: RuntimeSessionEvidence;
}): RuntimeHealthAssessment {
  const injected = input.sessionEvidence;
  const portReachable = input.port.reachable;

  if (injected?.healthStatusCode !== undefined || injected?.healthResponseType) {
    const statusCode = injected.healthStatusCode ?? null;
    const responseType = injected.healthResponseType ?? null;
    const healthState = deriveHealthState({ statusCode, responseType, portReachable });
    return {
      readOnly: true,
      healthState,
      statusCode,
      responseType,
      responseTimeMs: injected.responseTimeMs ?? null,
      healthEndpoint: injected.healthEndpoint ?? input.port.url,
      confidence: healthState === 'HEALTHY' ? 90 : healthState === 'PARTIAL' ? 65 : 40,
    };
  }

  return {
    readOnly: true,
    healthState: 'NOT_CHECKED',
    statusCode: null,
    responseType: null,
    responseTimeMs: null,
    healthEndpoint: input.port.url,
    confidence: 0,
  };
}

export function isHealthAcceptable(state: RuntimeHealthState): boolean {
  return state === 'HEALTHY' || state === 'PARTIAL';
}
