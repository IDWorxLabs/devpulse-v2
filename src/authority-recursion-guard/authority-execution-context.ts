/**
 * Phase 26.93 — Authority execution context stack (V1).
 */

import { DEFAULT_AUTHORITY_MAX_DEPTH } from './authority-recursion-guard-registry.js';
import type {
  AuthorityExecutionContextFrame,
  AuthorityExecutionGuardOptions,
  AuthorityGuardName,
} from './authority-recursion-guard-types.js';

let invocationCounter = 0;
let validatorModeDepth = 0;

const contextStack: AuthorityExecutionContextFrame[] = [];

function nextInvocationId(authorityName: AuthorityGuardName): string {
  invocationCounter += 1;
  return `${authorityName}-${invocationCounter}-${Date.now()}`;
}

export function resetAuthorityExecutionContextForTests(): void {
  contextStack.length = 0;
  invocationCounter = 0;
  validatorModeDepth = 0;
}

export function enterAuthorityValidatorMode(): void {
  validatorModeDepth += 1;
}

export function exitAuthorityValidatorMode(): void {
  validatorModeDepth = Math.max(0, validatorModeDepth - 1);
}

export function isAuthorityValidatorMode(): boolean {
  return validatorModeDepth > 0;
}

export function getAuthorityExecutionContextStack(): readonly AuthorityExecutionContextFrame[] {
  return contextStack;
}

export function getCurrentAuthorityExecutionContext(): AuthorityExecutionContextFrame | null {
  return contextStack[contextStack.length - 1] ?? null;
}

export function getAuthorityCallerStack(): string[] {
  return contextStack.map((frame) => frame.authorityName);
}

export function pushAuthorityExecutionContext(
  authorityName: AuthorityGuardName,
  options: AuthorityExecutionGuardOptions = {},
): AuthorityExecutionContextFrame {
  const parent = getCurrentAuthorityExecutionContext();
  const validatorMode = isAuthorityValidatorMode();
  const allowHeavyOrchestration =
    options.allowHeavyOrchestration ?? (validatorMode ? false : parent?.allowHeavyOrchestration ?? true);

  const frame: AuthorityExecutionContextFrame = {
    readOnly: true,
    authorityName,
    invocationId: nextInvocationId(authorityName),
    parentAuthority: options.parentAuthority ?? parent?.authorityName ?? null,
    depth: parent ? parent.depth + 1 : 0,
    visitedAuthorities: parent ? [...parent.visitedAuthorities, authorityName] : [authorityName],
    startedAt: new Date().toISOString(),
    maxDepth: options.maxDepth ?? parent?.maxDepth ?? DEFAULT_AUTHORITY_MAX_DEPTH,
    allowHeavyOrchestration,
    validatorMode,
  };
  contextStack.push(frame);
  return frame;
}

export function popAuthorityExecutionContext(authorityName: AuthorityGuardName): void {
  const top = contextStack[contextStack.length - 1];
  if (top?.authorityName === authorityName) {
    contextStack.pop();
  }
}

export function runWithAuthorityExecutionContext<T>(
  authorityName: AuthorityGuardName,
  options: AuthorityExecutionGuardOptions,
  invoke: () => T,
): T {
  pushAuthorityExecutionContext(authorityName, options);
  try {
    return invoke();
  } finally {
    popAuthorityExecutionContext(authorityName);
  }
}
