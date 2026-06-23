/**
 * Phase 26.93 — Authority recursion detector (V1).
 */

import {
  AUTHORITY_RECURSION_RECOMMENDED_FIX,
  FORBIDDEN_AUTHORITY_CHAINS,
  HEAVY_ORCHESTRATION_AUTHORITIES,
  TESTING_INFRASTRUCTURE_DEFECT,
} from './authority-recursion-guard-registry.js';
import {
  getAuthorityCallerStack,
  getCurrentAuthorityExecutionContext,
} from './authority-execution-context.js';
import type {
  AuthorityExecutionGuardOptions,
  AuthorityGuardName,
  AuthorityRecursionDetection,
} from './authority-recursion-guard-types.js';

const recentDetections: AuthorityRecursionDetection[] = [];

export function resetAuthorityRecursionDetectionsForTests(): void {
  recentDetections.length = 0;
}

export function getAuthorityRecursionDetections(): readonly AuthorityRecursionDetection[] {
  return recentDetections;
}

function recordDetection(detection: AuthorityRecursionDetection): AuthorityRecursionDetection {
  recentDetections.unshift(detection);
  if (recentDetections.length > 64) {
    recentDetections.length = 64;
  }
  return detection;
}

function buildDetection(input: {
  authorityName: AuthorityGuardName;
  ruleId: AuthorityRecursionDetection['ruleId'];
  reason: string;
}): AuthorityRecursionDetection {
  return recordDetection({
    readOnly: true,
    detected: true,
    recursionDetected: true,
    skippedHeavyOrchestration: true,
    ruleId: input.ruleId,
    reason: input.reason,
    callerStack: getAuthorityCallerStack(),
    authorityName: input.authorityName,
    launchImpact: TESTING_INFRASTRUCTURE_DEFECT,
    recommendedFix: AUTHORITY_RECURSION_RECOMMENDED_FIX,
  });
}

export function detectAuthorityRecursion(
  authorityName: AuthorityGuardName,
  options: AuthorityExecutionGuardOptions = {},
): AuthorityRecursionDetection | null {
  const parent = getCurrentAuthorityExecutionContext();
  const callerStack = getAuthorityCallerStack();

  if (parent && parent.visitedAuthorities.includes(authorityName) && !options.allowReentry) {
    return buildDetection({
      authorityName,
      ruleId: 'SAME_AUTHORITY_REENTRY',
      reason: `${authorityName} re-entered within the same authority chain`,
    });
  }

  const projectedDepth = parent ? parent.depth + 1 : 0;
  const maxDepth = options.maxDepth ?? parent?.maxDepth ?? 6;
  if (projectedDepth >= maxDepth) {
    return buildDetection({
      authorityName,
      ruleId: 'MAX_DEPTH_EXCEEDED',
      reason: `Authority depth ${projectedDepth} exceeds maxDepth ${maxDepth}`,
    });
  }

  const validatorMode = parent?.validatorMode ?? false;
  const allowHeavy = options.allowHeavyOrchestration ?? (validatorMode ? false : true);
  if (
    !allowHeavy &&
    (options.requireHeavyOrchestration ||
      HEAVY_ORCHESTRATION_AUTHORITIES.includes(authorityName))
  ) {
    return buildDetection({
      authorityName,
      ruleId: 'HEAVY_ORCHESTRATION_IN_VALIDATOR',
      reason: `Heavy orchestration blocked for ${authorityName} inside guarded validation path`,
    });
  }

  if (parent) {
    for (const chain of FORBIDDEN_AUTHORITY_CHAINS) {
      if (chain.from === parent.authorityName && chain.to === authorityName) {
        return buildDetection({
          authorityName,
          ruleId: chain.ruleId,
          reason: chain.reason,
        });
      }
    }
  }

  if (callerStack.length >= 2) {
    const tail = callerStack.slice(-4);
    if (tail.filter((name) => name === authorityName).length >= 2) {
      return buildDetection({
        authorityName,
        ruleId: 'SAME_AUTHORITY_REENTRY',
        reason: `${authorityName} appears multiple times in recent caller stack`,
      });
    }
  }

  return null;
}

export function shouldBlockHeavyOrchestration(authorityName: AuthorityGuardName): boolean {
  const parent = getCurrentAuthorityExecutionContext();
  if (!parent) return false;
  if (parent.validatorMode) return HEAVY_ORCHESTRATION_AUTHORITIES.includes(authorityName);
  return !parent.allowHeavyOrchestration && HEAVY_ORCHESTRATION_AUTHORITIES.includes(authorityName);
}
