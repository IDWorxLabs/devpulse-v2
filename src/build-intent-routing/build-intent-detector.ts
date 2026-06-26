/**
 * Build intent routing — detect prompts that must enter autonomous builder execution.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { classifyIntent } from '../intent-architecture/intent-extractor.js';

const BUILD_EXECUTION_CUES =
  /\b(begin build execution(?:\s+now)?|begin build|build execution|start (the )?build|generate architecture|generate plan|generate tasks|begin materialization|begin execution)\b/i;

const BUILD_VERBS = /\b(build|create|make|develop|generate|implement|scaffold|ship|materialize)\b/i;

const APP_TARGETS =
  /\b(web app|mobile app|application|software|product|platform|system|website|saas|portal|dashboard|tracker)\b/i;

export function resolveBuildIntentProfile(message: string): GeneratedAppProfile | null {
  const normalized = message.trim();
  if (!normalized) return null;
  const plan = resolvePromptFaithfulBuildPlan(normalized);
  return plan.materializationProfile as GeneratedAppProfile;
}

export function isBuildIntentRequest(message: string): boolean {
  const normalized = message.trim();
  if (normalized.length < 20) return false;

  if (resolveBuildIntentProfile(normalized)) return true;

  const lower = normalized.toLowerCase();
  const hasBuildVerb = BUILD_VERBS.test(lower);
  const hasAppTarget = APP_TARGETS.test(lower);
  const hasExecutionCue = BUILD_EXECUTION_CUES.test(lower);

  if (hasExecutionCue && hasBuildVerb) return true;
  if (hasBuildVerb && hasAppTarget) return true;

  const intent = classifyIntent(normalized);
  if (intent.intentType === 'BUILD_REQUEST' && intent.confidence !== 'LOW' && hasBuildVerb) {
    return true;
  }

  return false;
}

export function classifyBuildIntentRoute(message: string): 'BUILD_ORCHESTRATION' | 'CHAT_ONLY' {
  return isBuildIntentRequest(message) ? 'BUILD_ORCHESTRATION' : 'CHAT_ONLY';
}
