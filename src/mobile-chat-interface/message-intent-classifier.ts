/**
 * Message intent classifier — classifies mobile chat message intents.
 * Classification only. No execution.
 */

import type { MessageIntent, MobileChatInput } from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
} from './types.js';

export interface IntentClassificationResult {
  intent: MessageIntent;
  blocked: boolean;
  blockReason: string;
}

export function classifyMessageIntent(input: MobileChatInput): IntentClassificationResult {
  if (input.requestedAction) {
    const fromAction = mapRequestedAction(input.requestedAction);
    if (fromAction !== 'UNKNOWN') {
      return { intent: fromAction, blocked: false, blockReason: '' };
    }
  }

  const text = input.messageText.toLowerCase().trim();

  if (!text) {
    return { intent: 'UNKNOWN', blocked: true, blockReason: 'Empty message text' };
  }

  const executionBlock = detectBlockedPattern(text, EXECUTION_BLOCKED_PATTERNS, 'Direct execution attempt blocked');
  if (executionBlock) return { intent: 'UNKNOWN', blocked: true, blockReason: executionBlock };

  const fileBlock = detectBlockedPattern(text, FILE_MOD_BLOCKED_PATTERNS, 'Direct file modification attempt blocked');
  if (fileBlock) return { intent: 'UNKNOWN', blocked: true, blockReason: fileBlock };

  const codeBlock = detectBlockedPattern(text, CODE_GEN_BLOCKED_PATTERNS, 'Local code generation attempt blocked');
  if (codeBlock) return { intent: 'UNKNOWN', blocked: true, blockReason: codeBlock };

  const deployBlock = detectBlockedPattern(text, DEPLOY_BLOCKED_PATTERNS, 'Direct deployment attempt blocked');
  if (deployBlock) return { intent: 'UNKNOWN', blocked: true, blockReason: deployBlock };

  if (text.includes('grant approval') || text.includes('approve action') || text.includes('self approve')) {
    return { intent: 'UNKNOWN', blocked: true, blockReason: 'Approval self-granting blocked' };
  }

  if (text.includes('continue') || text.includes('resume project') || text.includes('keep going')) {
    return { intent: 'CONTINUE_PROJECT', blocked: false, blockReason: '' };
  }
  if (text.includes('switch project') || text.includes('switch to') || text.includes('change project')) {
    return { intent: 'SWITCH_PROJECT', blocked: false, blockReason: '' };
  }
  if (text.includes('status') || text.includes('progress') || text.includes('how is')) {
    return { intent: 'ASK_PROJECT_STATUS', blocked: false, blockReason: '' };
  }
  if (text.includes('vision') || text.includes('my goal') || text.includes('i want to build')) {
    return { intent: 'SEND_PROJECT_VISION', blocked: false, blockReason: '' };
  }

  if (
    text.includes('start world 1') ||
    text.includes('start world1') ||
    (input.worldTarget === 'WORLD_1' &&
      (text.includes('create project') || text.includes('new project') || text.includes('start project')))
  ) {
    return { intent: 'START_WORLD1_PROJECT', blocked: false, blockReason: '' };
  }

  if (
    text.includes('start world 2') ||
    text.includes('start world2') ||
    (input.worldTarget === 'WORLD_2' &&
      (text.includes('create project') || text.includes('new project') || text.includes('start project')))
  ) {
    return { intent: 'START_WORLD2_PROJECT', blocked: false, blockReason: '' };
  }

  if (text.includes('create project') || text.includes('new project') || text.includes('start project')) {
    return { intent: 'CREATE_PROJECT', blocked: false, blockReason: '' };
  }
  if (
    text.includes('notification') ||
    text.includes('alert') ||
    text.includes('respond to')
  ) {
    return { intent: 'ANSWER_NOTIFICATION', blocked: false, blockReason: '' };
  }
  if (text.includes('build') || text.includes('implement') || text.includes('add feature')) {
    return { intent: 'SEND_BUILD_INSTRUCTION', blocked: false, blockReason: '' };
  }
  if (text.includes('live preview') || text.includes('preview summary')) {
    return { intent: 'REQUEST_LIVE_PREVIEW_SUMMARY', blocked: false, blockReason: '' };
  }
  if (text.includes('operator feed') || text.includes('feed summary')) {
    return { intent: 'REQUEST_OPERATOR_FEED_SUMMARY', blocked: false, blockReason: '' };
  }
  if (text.includes('approval') || text.includes('pending decision')) {
    return { intent: 'REQUEST_APPROVALS', blocked: false, blockReason: '' };
  }
  return { intent: 'UNKNOWN', blocked: false, blockReason: '' };
}

function mapRequestedAction(action: string): MessageIntent {
  const normalized = action.trim().toUpperCase().replace(/\s+/g, '_');
  const intents: MessageIntent[] = [
    'CREATE_PROJECT',
    'START_WORLD1_PROJECT',
    'START_WORLD2_PROJECT',
    'CONTINUE_PROJECT',
    'SWITCH_PROJECT',
    'ASK_PROJECT_STATUS',
    'SEND_BUILD_INSTRUCTION',
    'SEND_PROJECT_VISION',
    'REQUEST_LIVE_PREVIEW_SUMMARY',
    'REQUEST_OPERATOR_FEED_SUMMARY',
    'REQUEST_APPROVALS',
    'ANSWER_NOTIFICATION',
  ];
  return intents.includes(normalized as MessageIntent) ? (normalized as MessageIntent) : 'UNKNOWN';
}

function detectBlockedPattern(text: string, patterns: readonly string[], reason: string): string | null {
  for (const pattern of patterns) {
    if (text.includes(pattern)) return reason;
  }
  return null;
}

export function intentKey(intent: MessageIntent, blocked: boolean): string {
  return `${intent}|${blocked}`;
}
