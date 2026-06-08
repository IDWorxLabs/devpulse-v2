/**
 * Execution classifier — determines operation type from request text.
 * Governance only; does not execute.
 */

import type { ExecutionClassification } from './types.js';

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function isReadOnlyOperation(requestText: string): boolean {
  const text = normalize(requestText);
  const readOnlyPatterns = [
    /^read\b/,
    /\bget\b/,
    /\blist\b/,
    /\bview\b/,
    /\bobserve\b/,
    /\bsummarize\b/,
    /\breport\b/,
    /\bvalidate\b/,
    /\bcheck\b/,
    /\bdisplay\b/,
    /\bshow\b/,
    /\bfetch\b/,
    /\bquery\b/,
  ];
  if (readOnlyPatterns.some((p) => p.test(text))) {
    const blockedSubstrings = ['write', 'run ', 'apply', 'rollback', 'autonomous', 'modify', 'delete', 'patch'];
    return !blockedSubstrings.some((s) => text.includes(s));
  }
  return false;
}

export function isWriteOperation(requestText: string): boolean {
  const text = normalize(requestText);
  return (
    /\bwrite\b/.test(text) ||
    /\bcreate file\b/.test(text) ||
    /\bupdate file\b/.test(text) ||
    /\bdelete\b/.test(text) ||
    /\bmodify\b/.test(text) ||
    /\bsave\b/.test(text)
  );
}

export function isCommandExecution(requestText: string): boolean {
  const text = normalize(requestText);
  return (
    /^run\b/.test(text) ||
    /\brun npm\b/.test(text) ||
    /\brun test\b/.test(text) ||
    /\bexecute command\b/.test(text) ||
    /\bshell\b/.test(text) ||
    /\bexec\b/.test(text)
  );
}

export function isProjectModification(requestText: string): boolean {
  const text = normalize(requestText);
  return (
    /\bapply patch\b/.test(text) ||
    /\bapply changes\b/.test(text) ||
    /\bmodify project\b/.test(text) ||
    /\bcommit changes\b/.test(text) ||
    /\bdeploy\b/.test(text)
  );
}

export function isRecoveryAction(requestText: string): boolean {
  const text = normalize(requestText);
  return (
    /\brollback\b/.test(text) ||
    /\brecover\b/.test(text) ||
    /\brestore checkpoint\b/.test(text) ||
    /\brevert\b/.test(text)
  );
}

export function isAutonomousAction(requestText: string): boolean {
  const text = normalize(requestText);
  return (
    /\bcontinue autonomously\b/.test(text) ||
    /\bautonomous\b/.test(text) ||
    /\bauto-execute\b/.test(text) ||
    /\bself-execute\b/.test(text)
  );
}

export function classifyExecutionRequest(requestText: string): ExecutionClassification {
  if (isAutonomousAction(requestText)) {
    return 'AUTONOMOUS_ACTION';
  }
  if (isRecoveryAction(requestText)) {
    return 'RECOVERY_ACTION';
  }
  if (isProjectModification(requestText)) {
    return 'PROJECT_MODIFICATION';
  }
  if (isCommandExecution(requestText)) {
    return 'COMMAND_EXECUTION';
  }
  if (isWriteOperation(requestText)) {
    return 'WRITE_OPERATION';
  }
  if (isReadOnlyOperation(requestText)) {
    return 'READ_ONLY';
  }
  return 'NO_EXECUTION';
}
