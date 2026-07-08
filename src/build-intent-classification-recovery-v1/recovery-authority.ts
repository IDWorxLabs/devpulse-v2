/**
 * Build Intent Classification Recovery V1 — imperative build phrase authority.
 * Runs before general conversational classification and legacy heuristics.
 */

import {
  BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
  BUILD_INTENT_RECOVERY_TRACE,
} from './recovery-events.js';

export type BuildIntentRecoveryConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type BuildIntentRequestCategory = 'BUILD' | 'GENERAL';

export interface BuildIntentRecoveryClassification {
  readOnly: true;
  contractVersion: typeof BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION;
  trace: typeof BUILD_INTENT_RECOVERY_TRACE;
  requestCategory: BuildIntentRequestCategory;
  buildIntentDetected: boolean;
  confidence: BuildIntentRecoveryConfidence;
  matchedBuildSignals: string[];
  routingReason: string;
  assistiveSignals: string[];
}

interface ImperativePattern {
  id: string;
  pattern: RegExp;
  signal: string;
}

/** Direct imperative build phrases that must always classify as BUILD_REQUEST. */
const IMPERATIVE_BUILD_PATTERNS: ImperativePattern[] = [
  {
    id: 'build-noun-app',
    pattern: /\bbuild\s+(?:a|an|the|my)\s+[\w-]+(?:\s+[\w-]+){0,4}\s*app\b/i,
    signal: 'imperative:build <name> app',
  },
  {
    id: 'build-calculator',
    pattern: /\bbuild\s+(?:a|an|the|my)\s+calculator\b/i,
    signal: 'imperative:build calculator',
  },
  {
    id: 'create-noun-app',
    pattern: /\bcreate\s+(?:a|an|the|my)\s+[\w-]+(?:\s+[\w-]+){0,4}\s*app\b/i,
    signal: 'imperative:create <name> app',
  },
  {
    id: 'create-calculator-app',
    pattern: /\bcreate\s+(?:a|an|the|my)\s+calculator\s+app\b/i,
    signal: 'imperative:create calculator app',
  },
  {
    id: 'make-expense-tracker',
    pattern: /\bmake\s+(?:a|an|the|my)\s+expense\s+tracker\b/i,
    signal: 'imperative:make expense tracker',
  },
  {
    id: 'generate-todo-app',
    pattern: /\bgenerate\s+(?:a|an|the|my)\s+todo\s+app\b/i,
    signal: 'imperative:generate todo app',
  },
  {
    id: 'build-website',
    pattern: /\bbuild\s+(?:a|an|the|my)\s+website\b/i,
    signal: 'imperative:build website',
  },
  {
    id: 'create-mobile-app',
    pattern: /\bcreate\s+(?:a|an|the|my)\s+mobile\s+app\b/i,
    signal: 'imperative:create mobile app',
  },
  {
    id: 'implement-feature',
    pattern: /\bimplement\s+this\s+feature\b/i,
    signal: 'imperative:implement this feature',
  },
  {
    id: 'finish-project',
    pattern: /\bfinish\s+this\s+project\b/i,
    signal: 'imperative:finish this project',
  },
  {
    id: 'rebuild-app',
    pattern: /\brebuild\s+this\s+app\b/i,
    signal: 'imperative:rebuild this app',
  },
  {
    id: 'build-generic-app',
    pattern: /\b(?:build|create|make|generate|develop|scaffold)\s+(?:a|an|the|my)\s+[\w-]+(?:\s+[\w-]+){0,3}\b/i,
    signal: 'imperative:build/create <product>',
  },
  {
    id: 'build-execution-cue',
    pattern:
      /\b(?:begin|start)\s+build\b|\bbuild\s+execution\b|\bgenerate\s+architecture\b|\bgenerate\s+plan\b|\bgenerate\s+tasks\b/i,
    signal: 'execution-cue:autonomous engineering',
  },
];

const ASSISTIVE_BUILD_SIGNALS: ImperativePattern[] = [
  { id: 'lisa-name', pattern: /\blisa\b/i, signal: 'assistive:lisa' },
  { id: 'assistive-comm', pattern: /\bassistive\s+communication\b/i, signal: 'assistive:communication' },
  { id: 'non-verbal', pattern: /\bnon[-\s]?verbal\b/i, signal: 'assistive:non-verbal' },
  { id: 'eye-tracking', pattern: /\beye[-\s]?tracking\b/i, signal: 'assistive:eye-tracking' },
  { id: 'caregiver', pattern: /\bcaregiver\s+dashboard\b/i, signal: 'assistive:caregiver-dashboard' },
  { id: 'emergency-speech', pattern: /\bemergency\s+speech\b/i, signal: 'assistive:emergency-speech' },
  { id: 'accessibility', pattern: /\baccessibility\b/i, signal: 'assistive:accessibility' },
  { id: 'aac', pattern: /\b(?:aac|augmentative)\b/i, signal: 'assistive:aac' },
];

const CHAT_ONLY_GREETING = /^(?:hello|hi|hey|thanks|thank you|good morning|good afternoon)\b/i;

function matchPatterns(message: string, patterns: ImperativePattern[]): string[] {
  const matched: string[] = [];
  for (const entry of patterns) {
    if (entry.pattern.test(message)) matched.push(entry.signal);
  }
  return matched;
}

/**
 * Recovery classifier — must run before general brain-request classification.
 */
export function classifyBuildIntentWithRecovery(message: string): BuildIntentRecoveryClassification {
  const normalized = message.trim();
  if (!normalized) {
    return {
      readOnly: true,
      contractVersion: BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
      trace: BUILD_INTENT_RECOVERY_TRACE,
      requestCategory: 'GENERAL',
      buildIntentDetected: false,
      confidence: 'LOW',
      matchedBuildSignals: [],
      routingReason: 'Empty message — not a build request',
      assistiveSignals: [],
    };
  }

  if (CHAT_ONLY_GREETING.test(normalized) && normalized.length < 40) {
    return {
      readOnly: true,
      contractVersion: BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
      trace: BUILD_INTENT_RECOVERY_TRACE,
      requestCategory: 'GENERAL',
      buildIntentDetected: false,
      confidence: 'HIGH',
      matchedBuildSignals: ['greeting-only'],
      routingReason: 'Short greeting — conversational chat only',
      assistiveSignals: [],
    };
  }

  const imperativeSignals = matchPatterns(normalized, IMPERATIVE_BUILD_PATTERNS);
  const assistiveSignals = matchPatterns(normalized, ASSISTIVE_BUILD_SIGNALS);
  const hasBuildVerb =
    /\b(build|create|make|generate|develop|implement|scaffold|materialize|rebuild|finish)\b/i.test(
      normalized,
    );
  const lisaBuild =
    assistiveSignals.length >= 2 && hasBuildVerb && /\b(?:build|create|generate)\b/i.test(normalized);

  if (imperativeSignals.length > 0 || lisaBuild) {
    const signals = [...imperativeSignals, ...(lisaBuild ? ['assistive:lisa-build-composite'] : [])];
    return {
      readOnly: true,
      contractVersion: BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
      trace: BUILD_INTENT_RECOVERY_TRACE,
      requestCategory: 'BUILD',
      buildIntentDetected: true,
      confidence: 'HIGH',
      matchedBuildSignals: signals,
      routingReason: lisaBuild
        ? `Assistive/mobile build request detected (${assistiveSignals.join(', ')})`
        : `Imperative build phrase detected (${imperativeSignals.join(', ')})`,
      assistiveSignals,
    };
  }

  if (assistiveSignals.length >= 3 && hasBuildVerb) {
    return {
      readOnly: true,
      contractVersion: BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
      trace: BUILD_INTENT_RECOVERY_TRACE,
      requestCategory: 'BUILD',
      buildIntentDetected: true,
      confidence: 'HIGH',
      matchedBuildSignals: [...assistiveSignals, 'assistive:multi-signal-build'],
      routingReason: `Assistive product build signals with build verb (${assistiveSignals.join(', ')})`,
      assistiveSignals,
    };
  }

  return {
    readOnly: true,
    contractVersion: BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION,
    trace: BUILD_INTENT_RECOVERY_TRACE,
    requestCategory: 'GENERAL',
    buildIntentDetected: false,
    confidence: 'LOW',
    matchedBuildSignals: [],
    routingReason: 'No imperative build phrase matched — defer to legacy build heuristics',
    assistiveSignals,
  };
}

export function isRecoveredBuildIntent(message: string): boolean {
  return classifyBuildIntentWithRecovery(message).buildIntentDetected;
}
