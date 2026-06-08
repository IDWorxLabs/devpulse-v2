/**
 * Brain API verification — endpoint reachability and stale-server detection.
 */

import type { BrainResponseResult } from '../brain-types.js';
import { processBrainRequest } from '../command-center-brain.js';

export const BRAIN_SERVER_CAPABILITY = 'command-center-brain-v11.1a';
export const BRAIN_HEALTH_PATH = '/api/brain/health';
export const BRAIN_RESPOND_PATH = '/api/brain/respond';

export const STALE_SERVER_READ_ONLY_MARKER = 'Founder Reality Surface is read-only';

export interface BrainHealthPayload {
  brainConnected: true;
  endpointReachable: true;
  phase: '11.1A';
  serverCapability: typeof BRAIN_SERVER_CAPABILITY;
  postAllowed: true;
  respondPath: typeof BRAIN_RESPOND_PATH;
  healthPath: typeof BRAIN_HEALTH_PATH;
  timestamp: number;
}

export interface BrainApiVerificationResult {
  endpointReachable: boolean;
  postAllowed: boolean;
  serverCapability: string | null;
  staleServerDetected: boolean;
  lastFailureReason: string | null;
  healthPayload: BrainHealthPayload | null;
}

export function buildBrainHealthPayload(timestamp = Date.now()): BrainHealthPayload {
  return {
    brainConnected: true,
    endpointReachable: true,
    phase: '11.1A',
    serverCapability: BRAIN_SERVER_CAPABILITY,
    postAllowed: true,
    respondPath: BRAIN_RESPOND_PATH,
    healthPath: BRAIN_HEALTH_PATH,
    timestamp,
  };
}

export function verifyBrainProcessing(message: string): {
  ok: boolean;
  result: BrainResponseResult | null;
  lastFailureReason: string | null;
} {
  try {
    const trimmed = message.trim();
    if (!trimmed) {
      return { ok: false, result: null, lastFailureReason: 'Empty message — request not processed' };
    }
    const result = processBrainRequest({ message: trimmed, timestamp: Date.now() });
    if (!result.brainResponse?.trim()) {
      return { ok: false, result: null, lastFailureReason: 'Brain response empty — response generation failed' };
    }
    if (!result.classification?.category) {
      return { ok: false, result, lastFailureReason: 'Classification failed — category missing' };
    }
    if (!result.roadmapContext?.currentPhase) {
      return { ok: false, result, lastFailureReason: 'Roadmap context unavailable' };
    }
    return { ok: true, result, lastFailureReason: null };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Brain processing threw an error';
    return { ok: false, result: null, lastFailureReason: reason };
  }
}

export function interpretHttpBrainFailure(status: number, bodyText: string): string {
  if (status === 405 && bodyText.includes(STALE_SERVER_READ_ONLY_MARKER)) {
    return 'Stale DevPulse server detected — restart with npm run dev to enable Brain POST /api/brain/respond';
  }
  if (status === 405) {
    return 'Brain API unavailable — server rejected POST (Method Not Allowed). Restart npm run dev.';
  }
  if (status === 404) {
    return 'Brain API unavailable — /api/brain/respond not found. Restart npm run dev.';
  }
  if (status === 400) {
    return `Brain response malformed — ${bodyText.slice(0, 120) || 'invalid request'}`;
  }
  if (status >= 500) {
    return 'Brain API server error — check terminal running npm run dev';
  }
  return `Brain API request failed — HTTP ${status}`;
}

export function verifyHealthResponsePayload(payload: unknown): BrainApiVerificationResult {
  if (!payload || typeof payload !== 'object') {
    return {
      endpointReachable: false,
      postAllowed: false,
      serverCapability: null,
      staleServerDetected: false,
      lastFailureReason: 'Brain health response malformed',
      healthPayload: null,
    };
  }
  const record = payload as Record<string, unknown>;
  const capability = typeof record.serverCapability === 'string' ? record.serverCapability : null;
  const postAllowed = record.postAllowed === true;
  const healthPayload: BrainHealthPayload | null =
    capability === BRAIN_SERVER_CAPABILITY && postAllowed
      ? {
          brainConnected: true,
          endpointReachable: true,
          phase: '11.1A',
          serverCapability: BRAIN_SERVER_CAPABILITY,
          postAllowed: true,
          respondPath: BRAIN_RESPOND_PATH,
          healthPath: BRAIN_HEALTH_PATH,
          timestamp: typeof record.timestamp === 'number' ? record.timestamp : Date.now(),
        }
      : null;

  return {
    endpointReachable: true,
    postAllowed,
    serverCapability: capability,
    staleServerDetected: false,
    lastFailureReason: healthPayload ? null : 'Brain health payload missing expected capability',
    healthPayload,
  };
}
