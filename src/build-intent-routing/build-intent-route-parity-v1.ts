/**
 * Build Intent Route Parity V1 — shared classification contract for Command Center UI and server.
 * Server remains final authority; UI uses the same classifier via /api/brain/classify-build-intent.
 */

import { classifyBuildIntentWithRecovery } from '../build-intent-classification-recovery-v1/index.js';
import {
  classifyBuildIntentRoute,
  isBuildIntentRequest,
  legacyDetectBuildIntent,
} from './build-intent-detector.js';

export const BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN = 'BUILD_INTENT_ROUTE_PARITY_V1_PASS';

export const BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION = 'BUILD_INTENT_ROUTE_PARITY_V1' as const;

/** Health payload marker — stale servers without route parity omit this field. */
export const BUILD_INTENT_ROUTE_PARITY_V1_HEALTH_MARKER = true as const;

/** Matrix categories used to prove UI/server parity without app-specific hardcoding. */
export const BUILD_INTENT_ROUTE_PARITY_MATRIX_IDS = [
  'expense-tracker',
  'saas-crm',
  'ai-chat-app',
] as const;

/** Prompts that must remain chat-only across UI and server. */
export const BUILD_INTENT_ROUTE_PARITY_CHAT_ONLY_PROMPTS = [
  'What is the current status of my active project?',
  'How does JWT authentication work in a typical web app?',
  'Thanks for checking in today.',
  'What time is it?',
] as const;

export type BuildIntentRoute = 'BUILD_ORCHESTRATION' | 'CHAT_ONLY';
export type BuildIntentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type BuildIntentRequestCategory = 'BUILD' | 'GENERAL';

export interface BuildIntentClassification {
  contractVersion: typeof BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION;
  isBuildIntent: boolean;
  route: BuildIntentRoute;
  requestCategory: BuildIntentRequestCategory;
  buildIntentDetected: boolean;
  confidence: BuildIntentConfidence;
  matchedBuildSignals: string[];
  routingReason: string;
  recoveryTrace?: string;
  assistiveSignals?: string[];
}

/** Canonical shared classifier — recovery runs first, then legacy heuristics. */
export function classifyBuildIntentRequest(message: string): BuildIntentClassification {
  const normalized = message.trim();
  const recovery = classifyBuildIntentWithRecovery(normalized);
  const legacyMatch = legacyDetectBuildIntent(normalized);
  const isBuildIntent = recovery.buildIntentDetected || legacyMatch;

  let confidence: BuildIntentConfidence = 'LOW';
  let routingReason = recovery.routingReason;
  const matchedBuildSignals = [...recovery.matchedBuildSignals];

  if (recovery.buildIntentDetected) {
    confidence = recovery.confidence;
  } else if (legacyMatch) {
    confidence = 'MEDIUM';
    routingReason = 'Legacy build heuristics matched after recovery pass';
    matchedBuildSignals.push('legacy:heuristic-match');
  } else {
    routingReason = 'No build intent detected';
  }

  return {
    contractVersion: BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
    isBuildIntent,
    route: classifyBuildIntentRoute(normalized),
    requestCategory: isBuildIntent ? 'BUILD' : 'GENERAL',
    buildIntentDetected: isBuildIntent,
    confidence,
    matchedBuildSignals,
    routingReason,
    recoveryTrace: recovery.trace,
    assistiveSignals: recovery.assistiveSignals,
  };
}

export function isBuildIntentClassification(
  value: BuildIntentClassification | null | undefined,
): value is BuildIntentClassification & { isBuildIntent: true } {
  return (
    value?.contractVersion === BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION &&
    value.isBuildIntent === true
  );
}
