/**
 * DevPulse V2 Self Vision Authority — structured UI observation layer.
 * Does NOT execute actions, modify UI, click controls, repair problems, or generate code.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { GUARD_OWNER_MODULE } from '../visible-ui-guard/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import type { VisibleUiElementRecord } from '../visible-ui-guard/types.js';
import {
  getLatestObservationSummary,
  publishObservationSummary,
  resetSelfVisionBrainBridgeForTests,
} from './self-vision-brain-bridge.js';
import {
  getBrowserObservationSummary,
  observeHarnessResults,
} from './self-vision-browser-bridge.js';
import {
  publishObservationEvidence,
  resetSelfVisionEvidenceBridgeForTests,
} from './self-vision-evidence-bridge.js';
import {
  observeElement,
  observeRegisteredUi,
  observeVisibleUi,
  summarizeObservations,
} from './self-vision-engine.js';
import { formatSelfVisionReport } from './self-vision-report.js';
import {
  recordObservationEvent,
  recordObservationSession,
  resetSelfVisionTimelineBridgeForTests,
} from './self-vision-timeline-bridge.js';
import {
  observeRegisteredElements,
  observeRequiredElements,
} from './self-vision-ui-bridge.js';
import type {
  ObservationRecord,
  ObservationSession,
  ObservationSummary,
  SelfVisionAuthorityState,
} from './types.js';
import { SELF_VISION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2SelfVisionAuthority | null = null;

export class DevPulseV2SelfVisionAuthority {
  private readonly sessions: ObservationSession[] = [];
  private authorityWarnings: string[] = [
    'Self Vision is observation-only — no execution, mutation, repair, replay, or code generation.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = SELF_VISION_OWNER_MODULE;
  static readonly ownerDomain = 'self_vision' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('self_vision');
    return owner.ownerModule === SELF_VISION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const selfVision = getDevPulseV2Owner('self_vision');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      selfVision.ownerModule === SELF_VISION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2SelfVisionAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined' &&
      typeof (authority as { performAction?: unknown }).performAction === 'undefined'
    );
  }

  static assertDoesNotModifyUi(): boolean {
    const authority = new DevPulseV2SelfVisionAuthority();
    return (
      typeof (authority as { mutateUi?: unknown }).mutateUi === 'undefined' &&
      typeof (authority as { modifyUi?: unknown }).modifyUi === 'undefined' &&
      typeof (authority as { renderPanel?: unknown }).renderPanel === 'undefined' &&
      typeof (authority as { mountUi?: unknown }).mountUi === 'undefined'
    );
  }

  static assertDoesNotPerformClicks(): boolean {
    const authority = new DevPulseV2SelfVisionAuthority();
    return (
      typeof (authority as { click?: unknown }).click === 'undefined' &&
      typeof (authority as { clickControl?: unknown }).clickControl === 'undefined' &&
      typeof (authority as { simulateClick?: unknown }).simulateClick === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2SelfVisionAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceBrowserHarness(): boolean {
    return getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE;
  }

  static assertDoesNotReplaceVisibleUiGuard(): boolean {
    return getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  createObservationSession(observations: ObservationRecord[]): ObservationSession {
    const session: ObservationSession = {
      sessionId: `obs-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      observations: observations.map((o) => ({ ...o, warnings: [...o.warnings], errors: [...o.errors] })),
      warnings: ['Observation session created — read-only.'],
      errors: [],
    };
    this.sessions.push(session);
    return { ...session, observations: [...session.observations], warnings: [...session.warnings], errors: [...session.errors] };
  }

  observeElement(record: VisibleUiElementRecord, htmlOrDomSnapshot: string): ObservationRecord {
    return observeElement(record, htmlOrDomSnapshot);
  }

  observeRegisteredUi(htmlOrDomSnapshot: string): ObservationSession {
    const session = observeRegisteredUi(htmlOrDomSnapshot);
    this.sessions.push(session);
    return {
      ...session,
      observations: session.observations.map((o) => ({ ...o, warnings: [...o.warnings], errors: [...o.errors] })),
      warnings: [...session.warnings],
      errors: [...session.errors],
    };
  }

  observeVisibleUi(): ObservationSession {
    const session = observeVisibleUi();
    this.sessions.push(session);
    return {
      ...session,
      observations: session.observations.map((o) => ({ ...o, warnings: [...o.warnings], errors: [...o.errors] })),
      warnings: [...session.warnings],
      errors: [...session.errors],
    };
  }

  summarizeObservations(session: ObservationSession): ObservationSummary {
    return summarizeObservations(session);
  }

  observeRegisteredElements(htmlOrDomSnapshot: string): ObservationSession {
    return observeRegisteredElements(htmlOrDomSnapshot);
  }

  observeRequiredElements(htmlOrDomSnapshot: string): ObservationRecord[] {
    return observeRequiredElements(htmlOrDomSnapshot);
  }

  observeHarnessResults(): ObservationRecord[] {
    return observeHarnessResults();
  }

  getBrowserObservationSummary(): string {
    return getBrowserObservationSummary();
  }

  recordObservationEvent(record: ObservationRecord) {
    return recordObservationEvent(record);
  }

  recordObservationSession(session: ObservationSession) {
    return recordObservationSession(session);
  }

  publishObservationEvidence(record: ObservationRecord) {
    return publishObservationEvidence(record);
  }

  publishObservationSummary(summary: ObservationSummary): ObservationSummary {
    return publishObservationSummary(summary);
  }

  getLatestObservationSummary(): ObservationSummary | null {
    return getLatestObservationSummary();
  }

  getObservationSessions(): ObservationSession[] {
    return this.sessions.map((s) => ({
      ...s,
      observations: s.observations.map((o) => ({ ...o, warnings: [...o.warnings], errors: [...o.errors] })),
      warnings: [...s.warnings],
      errors: [...s.errors],
    }));
  }

  getAuthorityState(): SelfVisionAuthorityState {
    const observationCount = this.sessions.reduce((n, s) => n + s.observations.length, 0);
    return {
      ownerModule: SELF_VISION_OWNER_MODULE,
      sessionCount: this.sessions.length,
      observationCount,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  formatReport(): string {
    return formatSelfVisionReport(this.getObservationSessions(), this.getLatestObservationSummary());
  }
}

export function createDevPulseV2SelfVisionAuthority(): DevPulseV2SelfVisionAuthority {
  singleton = new DevPulseV2SelfVisionAuthority();
  return singleton;
}

export function getDevPulseV2SelfVisionAuthority(): DevPulseV2SelfVisionAuthority {
  if (!singleton) {
    singleton = new DevPulseV2SelfVisionAuthority();
  }
  return singleton;
}

export function resetDevPulseV2SelfVisionAuthorityForTests(): DevPulseV2SelfVisionAuthority {
  resetSelfVisionBrainBridgeForTests();
  resetSelfVisionEvidenceBridgeForTests();
  resetSelfVisionTimelineBridgeForTests();
  singleton = new DevPulseV2SelfVisionAuthority();
  return singleton;
}
