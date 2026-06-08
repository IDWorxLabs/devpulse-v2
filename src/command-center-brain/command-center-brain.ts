/**
 * DevPulse V2 Unified Command Center Brain — Phase 11.1.
 * Local intelligence orchestration. Thinks — does NOT execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { classifyBrainRequest, classificationKey } from './brain-request-classifier.js';
import { getBrainRoadmapContext, roadmapContextKey } from './brain-roadmap-awareness.js';
import {
  assertBrainNotSecondCentralBrain,
  assertDistinctFromCentralBrain,
  findSystemByKeyword,
  getCommandCenterAwareSystems,
  systemsAwarenessKey,
} from './brain-system-awareness.js';
import {
  generateBlockedResponse,
  generateBrainResponse,
  responseKey,
} from './brain-response-generator.js';
import type {
  BrainPipelineStage,
  BrainRequestInput,
  BrainResponseResult,
  OperatorFeedEvent,
  OperatorFeedEventType,
} from './brain-types.js';
import {
  BRAIN_PIPELINE_SEQUENCE,
  CODE_GEN_BLOCKED_PATTERNS,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
  DUPLICATE_BRAIN_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  OPERATOR_FEED_EVENT_SEQUENCE,
  nextBrainResponseId,
} from './brain-types.js';

function getForbiddenPatterns(): string[] {
  return [
    'fs' + '.writeFileSync',
    'fs' + '.rmSync',
    'child' + '_process',
    'exec' + '(',
    'spawn' + '(',
    'eval' + '(',
  ];
}

function detectBlockedIntent(message: string): string | null {
  const lower = message.toLowerCase();
  const checks: Array<[readonly string[], string]> = [
    [EXECUTION_BLOCKED_PATTERNS, 'execution requests are blocked — intelligence only'],
    [CODE_GEN_BLOCKED_PATTERNS, 'code generation requests are blocked'],
    [FILE_MOD_BLOCKED_PATTERNS, 'file modification requests are blocked'],
  ];
  for (const [patterns, reason] of checks) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) return reason;
    }
  }
  return null;
}

function buildOperatorFeedEvents(timestamp: number): OperatorFeedEvent[] {
  return OPERATOR_FEED_EVENT_SEQUENCE.map((eventType, index) => ({
    eventId: `feed-${(index + 1).toString().padStart(2, '0')}`,
    eventType,
    timestamp: timestamp + index,
    informationalOnly: true as const,
  }));
}

function buildPipelineStages(blocked: boolean): BrainPipelineStage[] {
  if (blocked) return ['BRAIN_REQUEST_RECEIVED', 'BRAIN_REQUEST_BLOCKED'];
  return [...BRAIN_PIPELINE_SEQUENCE];
}

export function processBrainRequest(input: BrainRequestInput): BrainResponseResult {
  const timestamp = input.timestamp ?? Date.now();
  const message = input.message?.trim() ?? '';
  const blockedReason = !message ? 'empty message' : detectBlockedIntent(message);
  const blocked = Boolean(blockedReason);

  const classification = blocked
    ? { category: 'GENERAL' as const, confidence: 'LOW' as const, matchedSignals: [], reason: 'blocked' }
    : classifyBrainRequest({ message, timestamp });

  const systems = blocked ? [] : getCommandCenterAwareSystems();
  const referenced = blocked ? [] : findSystemByKeyword(message).map((s) => s.systemId);
  const roadmap = getBrainRoadmapContext();

  const brainResponse = blocked
    ? generateBlockedResponse(blockedReason!)
    : generateBrainResponse(message, classification, systems, roadmap);

  const pipelineStages = buildPipelineStages(blocked);
  const operatorFeedEvents = blocked ? [] : buildOperatorFeedEvents(timestamp);

  return {
    responseId: nextBrainResponseId(),
    userMessage: message,
    brainResponse,
    category: classification.category,
    classification,
    systemsReferenced: referenced,
    roadmapContext: roadmap,
    pipelineStages,
    operatorFeedEvents,
    confirmation: {
      intelligenceOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noRuntimeMutation: true,
      noExternalAiCalls: true,
      noPersistence: true,
      noSystemReplacement: true,
    },
    createdAt: timestamp,
  };
}

export function brainStructuralKey(result: BrainResponseResult): string {
  return [
    result.userMessage.trim().toLowerCase(),
    classificationKey(result.classification),
    responseKey(result.category, result.userMessage),
    systemsAwarenessKey(getCommandCenterAwareSystems()),
    roadmapContextKey(result.roadmapContext),
    result.pipelineStages.join('→'),
  ].join('|');
}

export function scanBrainModuleForForbiddenPatterns(moduleDir: string): string[] {
  const violations: string[] = [];

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.ts')) continue;
      const content = readFileSync(fullPath, 'utf8');
      for (const pattern of getForbiddenPatterns()) {
        if (content.includes(pattern)) violations.push(`${fullPath}: forbidden "${pattern}"`);
      }
    }
  }

  scanDir(moduleDir);
  return violations;
}

export class DevPulseV2CommandCenterBrain {
  static readonly ownerModule = COMMAND_CENTER_BRAIN_OWNER_MODULE;
  static readonly ownerDomain = 'command_center_brain' as const;
  static readonly passToken = COMMAND_CENTER_BRAIN_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('command_center_brain');
    return owner.ownerModule === COMMAND_CENTER_BRAIN_OWNER_MODULE && owner.phase === 11.1;
  }

  static assertDistinctFromCentralBrain(): boolean {
    return assertDistinctFromCentralBrain() && assertBrainNotSecondCentralBrain();
  }

  static assertNoDuplicateBrain(): boolean {
    const registered = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const brainOwner = getDevPulseV2Owner('command_center_brain').ownerModule;
    return DUPLICATE_BRAIN_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registered].filter(
        (m) => (m.includes(normalized) || m.includes('command_center_brain')) && m !== brainOwner,
      );
      return competing.length === 0;
    });
  }

  static assertDoesNotExecute(): boolean {
    const brain = new DevPulseV2CommandCenterBrain();
    return (
      typeof (brain as { execute?: unknown }).execute === 'undefined' &&
      typeof (brain as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (brain as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (brain as { deploy?: unknown }).deploy === 'undefined'
    );
  }

  static assertNoForbiddenPatterns(): boolean {
    const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)));
    return scanBrainModuleForForbiddenPatterns(moduleDir).length === 0;
  }

  respond(input: BrainRequestInput): BrainResponseResult {
    return processBrainRequest(input);
  }
}

let singleton: DevPulseV2CommandCenterBrain | null = null;

export function getDevPulseV2CommandCenterBrain(): DevPulseV2CommandCenterBrain {
  if (!singleton) singleton = new DevPulseV2CommandCenterBrain();
  return singleton;
}

export function resetDevPulseV2CommandCenterBrainForTests(): DevPulseV2CommandCenterBrain {
  singleton = new DevPulseV2CommandCenterBrain();
  return singleton;
}

export {
  classificationKey,
  responseKey,
  systemsAwarenessKey,
  roadmapContextKey,
  BRAIN_PIPELINE_SEQUENCE,
  OPERATOR_FEED_EVENT_SEQUENCE,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
};
