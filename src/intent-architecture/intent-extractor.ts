/**
 * Lightweight rule-based intent extraction — no AI, LLM, or external services.
 */

import type { IntentConfidence, IntentRecord, IntentType } from './types.js';

function createIntentId(): string {
  return `intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeIntent(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

interface ClassificationMatch {
  intentType: IntentType;
  confidence: IntentConfidence;
}

export function classifyIntent(input: string): ClassificationMatch {
  const normalized = normalizeIntent(input).toLowerCase();

  if (!normalized) {
    return { intentType: 'UNKNOWN', confidence: 'LOW' };
  }

  if (
    /^(what|why|how|when|where|who|is|are|can|does|do)\b/.test(normalized) ||
    normalized.endsWith('?')
  ) {
    return { intentType: 'QUESTION', confidence: 'HIGH' };
  }

  if (/\b(build|create|make|develop|implement|construct)\b/.test(normalized)) {
    if (/\b(mobile app|web app|application|product|system)\b/.test(normalized)) {
      return { intentType: 'BUILD_REQUEST', confidence: 'HIGH' };
    }
    return { intentType: 'BUILD_REQUEST', confidence: 'MEDIUM' };
  }

  if (/\b(analyze|analysis|review|audit|assess|evaluate)\b/.test(normalized)) {
    if (/\b(architecture|design|system|codebase)\b/.test(normalized)) {
      return { intentType: 'ANALYSIS_REQUEST', confidence: 'HIGH' };
    }
    return { intentType: 'ANALYSIS_REQUEST', confidence: 'MEDIUM' };
  }

  if (/\b(project|start a project|new project|create project)\b/.test(normalized)) {
    return { intentType: 'PROJECT_REQUEST', confidence: 'HIGH' };
  }

  if (/\b(tell me|explain|describe|show me|information about|learn about)\b/.test(normalized)) {
    return { intentType: 'INFORMATION_REQUEST', confidence: 'MEDIUM' };
  }

  return { intentType: 'UNKNOWN', confidence: 'LOW' };
}

function extractGoals(normalized: string): string[] {
  const goals: string[] = [];
  const wantMatch = normalized.match(/\b(?:i want to|need to|goal is to)\s+(.+?)(?:\.|$)/i);
  if (wantMatch?.[1]) {
    goals.push(wantMatch[1].trim());
  }
  const buildMatch = normalized.match(/\b(?:build|create|make|develop)\s+(.+?)(?:\.|$)/i);
  if (buildMatch?.[1] && !goals.includes(buildMatch[1].trim())) {
    goals.push(buildMatch[1].trim());
  }
  return goals;
}

function extractConstraints(normalized: string): string[] {
  const constraints: string[] = [];
  const withoutMatches = normalized.matchAll(/\b(?:without|must not|don't|do not|no)\s+([^,.]+)/gi);
  for (const match of withoutMatches) {
    if (match[1]) constraints.push(match[1].trim());
  }
  return constraints;
}

export function summarizeIntent(intent: IntentRecord): string {
  const goals =
    intent.extractedGoals.length > 0
      ? ` goals=[${intent.extractedGoals.join('; ')}]`
      : '';
  const constraints =
    intent.extractedConstraints.length > 0
      ? ` constraints=[${intent.extractedConstraints.join('; ')}]`
      : '';
  return (
    `Intent ${intent.intentType} (${intent.confidence} confidence): ` +
    `"${intent.normalizedInput}"${goals}${constraints}`
  );
}

export function extractIntent(input: string): IntentRecord {
  const rawInput = input;
  const normalizedInput = normalizeIntent(input);
  const { intentType, confidence } = classifyIntent(input);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!normalizedInput) {
    errors.push('Empty input cannot be interpreted as intent.');
  }

  if (intentType === 'UNKNOWN') {
    warnings.push('Intent type could not be confidently classified — downstream systems should treat as ambiguous.');
  }

  warnings.push('Intent Architecture understands only — it does not answer, execute, or generate code.');

  return {
    intentId: createIntentId(),
    createdAt: Date.now(),
    rawInput,
    normalizedInput,
    intentType,
    confidence,
    extractedGoals: extractGoals(normalizedInput),
    extractedConstraints: extractConstraints(normalizedInput),
    warnings,
    errors,
  };
}
