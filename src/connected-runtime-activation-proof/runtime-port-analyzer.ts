/**
 * Runtime Port Analyzer — detect whether runtime opened a local port.
 */

import type {
  RuntimePortAssessment,
  RuntimePortState,
  RuntimeProcessAssessment,
  RuntimeSessionEvidence,
} from './connected-runtime-activation-proof-types.js';

export function analyzeRuntimePort(input: {
  process: RuntimeProcessAssessment;
  sessionEvidence?: RuntimeSessionEvidence;
}): RuntimePortAssessment {
  const injected = input.sessionEvidence;

  if (injected?.port !== undefined || injected?.url) {
    const reachable = injected.reachable ?? false;
    let portState: RuntimePortState = 'NOT_OBSERVED';
    if (injected.port !== undefined) portState = 'OBSERVED';
    if (reachable) portState = 'REACHABLE';
    else if (injected.port !== undefined && injected.reachable === false) portState = 'UNREACHABLE';

    const host = injected.host ?? 'localhost';
    const port = injected.port ?? null;
    const url =
      injected.url ?? (port !== null ? `${injected.protocol ?? 'http'}://${host}:${port}` : null);

    return {
      readOnly: true,
      portState,
      port,
      host,
      url,
      reachable,
      protocol: injected.protocol ?? (port !== null ? 'http' : null),
      sourceProcessSessionId:
        injected.runtimeSessionId ?? input.process.runtimeSessionId,
      confidence: reachable ? 90 : port !== null ? 65 : 40,
    };
  }

  return {
    readOnly: true,
    portState: 'NOT_OBSERVED',
    port: null,
    host: null,
    url: null,
    reachable: false,
    protocol: null,
    sourceProcessSessionId: input.process.runtimeSessionId,
    confidence: 0,
  };
}

export function isPortReachable(assessment: RuntimePortAssessment): boolean {
  return assessment.portState === 'REACHABLE' && assessment.reachable;
}
