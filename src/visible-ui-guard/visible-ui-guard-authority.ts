/**
 * DevPulse V2 Visible UI Guard Authority — registration and clickability proof guardrail.
 * Does NOT build UI panels, replace Shell, or replace Browser Verification Harness.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { SHELL_OWNER_MODULE } from '../shell/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  checkVisibleUiElement,
  runUiChecksForRegistry,
  summarizeUiChecks,
} from './clickability-check-engine.js';
import {
  buildUiClickabilityChecks,
  buildUiVisibilityChecks,
  getUiElementsForBrowserVerification,
} from './visible-ui-browser-bridge.js';
import { formatVisibleUiGuardReport } from './visible-ui-guard-report.js';
import { validatePromptHasVisibleUiRequirements } from './visible-ui-prompt-policy.js';
import {
  getVisibleUiRegistry,
  resetVisibleUiRegistryForTests,
  type VisibleUiRegistry,
} from './visible-ui-registry.js';
import type {
  VisibleUiCheckResult,
  VisibleUiElementInput,
  VisibleUiElementRecord,
  VisibleUiRegistryState,
  VisibleUiSnapshot,
} from './types.js';
import { GUARD_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2VisibleUiGuardAuthority | null = null;

export class DevPulseV2VisibleUiGuardAuthority {
  private readonly registry: VisibleUiRegistry = getVisibleUiRegistry();
  private lastCheckResults: VisibleUiCheckResult[] = [];

  static readonly ownerModule = GUARD_OWNER_MODULE;
  static readonly ownerDomain = 'visible_ui_clickability_guard' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('visible_ui_clickability_guard');
    return owner.ownerModule === GUARD_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const guard = getDevPulseV2Owner('visible_ui_clickability_guard');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      guard.ownerModule === GUARD_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotReplaceBrowserHarness(): boolean {
    return getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE;
  }

  static assertDoesNotReplaceShell(): boolean {
    return getDevPulseV2Owner('shell_authority').ownerModule === SHELL_OWNER_MODULE;
  }

  static assertDoesNotCreateUiPanels(): boolean {
    const guard = new DevPulseV2VisibleUiGuardAuthority();
    return (
      typeof (guard as { createPanel?: unknown }).createPanel === 'undefined' &&
      typeof (guard as { renderPanel?: unknown }).renderPanel === 'undefined' &&
      typeof (guard as { mountUi?: unknown }).mountUi === 'undefined'
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  registerVisibleUiElement(input: VisibleUiElementInput): VisibleUiElementRecord {
    return this.registry.registerVisibleUiElement(input);
  }

  getVisibleUiElement(elementId: string): VisibleUiElementRecord | null {
    return this.registry.getVisibleUiElement(elementId);
  }

  listVisibleUiElements(): VisibleUiElementRecord[] {
    return this.registry.listVisibleUiElements();
  }

  listVisibleUiElementsByOwner(ownerSystemId: string): VisibleUiElementRecord[] {
    return this.registry.listVisibleUiElementsByOwner(ownerSystemId);
  }

  createVisibleUiSnapshot(): VisibleUiSnapshot {
    return this.registry.createVisibleUiSnapshot();
  }

  getVisibleUiRegistryState(): VisibleUiRegistryState {
    return this.registry.getVisibleUiRegistryState();
  }

  runChecks(htmlOrDomSnapshot: string): VisibleUiCheckResult[] {
    this.lastCheckResults = runUiChecksForRegistry(this.listVisibleUiElements(), htmlOrDomSnapshot);
    return this.lastCheckResults.map((r) => ({ ...r, warnings: [...r.warnings], errors: [...r.errors] }));
  }

  checkElement(record: VisibleUiElementRecord, htmlOrDomSnapshot: string): VisibleUiCheckResult {
    return checkVisibleUiElement(record, htmlOrDomSnapshot);
  }

  getLastCheckResults(): VisibleUiCheckResult[] {
    return this.lastCheckResults.map((r) => ({
      ...r,
      warnings: [...r.warnings],
      errors: [...r.errors],
    }));
  }

  getUiElementsForBrowserVerification(): VisibleUiElementRecord[] {
    return getUiElementsForBrowserVerification();
  }

  buildUiVisibilityChecks() {
    return buildUiVisibilityChecks();
  }

  buildUiClickabilityChecks() {
    return buildUiClickabilityChecks();
  }

  validatePromptHasVisibleUiRequirements(promptText: string) {
    return validatePromptHasVisibleUiRequirements(promptText);
  }

  formatReport(): string {
    return formatVisibleUiGuardReport(
      this.getVisibleUiRegistryState(),
      this.listVisibleUiElements(),
      this.lastCheckResults,
    );
  }

  summarizeLastChecks(): string {
    return summarizeUiChecks(this.lastCheckResults);
  }
}

export function createDevPulseV2VisibleUiGuardAuthority(): DevPulseV2VisibleUiGuardAuthority {
  singleton = new DevPulseV2VisibleUiGuardAuthority();
  return singleton;
}

export function getDevPulseV2VisibleUiGuardAuthority(): DevPulseV2VisibleUiGuardAuthority {
  if (!singleton) {
    singleton = new DevPulseV2VisibleUiGuardAuthority();
  }
  return singleton;
}

export function resetDevPulseV2VisibleUiGuardAuthorityForTests(): DevPulseV2VisibleUiGuardAuthority {
  resetVisibleUiRegistryForTests();
  singleton = new DevPulseV2VisibleUiGuardAuthority();
  return singleton;
}
