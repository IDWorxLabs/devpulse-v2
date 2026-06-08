/**
 * DevPulse V2 Trust Engine Authority — observes and scores trust from existing authorities.
 * Does NOT block Chat, become answer authority, or replace Browser Verification Harness.
 */

import { getDevPulseV2BrowserVerificationHarness } from '../browser-verification/browser-verification-harness.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { getDevPulseV2ChatAuthority } from '../chat/chat-authority.js';
import { FOUNDATION_RESPONSE_TEXT } from '../chat/types.js';
import { runDevPulseV2ConstitutionalValidation } from '../foundation/constitutional-validator.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { feedEventsAreNotAssistantAnswers } from '../operator-feed/index.js';
import { FOUNDATION_FEED_STAGES } from '../operator-feed/types.js';
import { getDevPulseV2ShellAuthority } from '../shell/shell-authority.js';
import { getDevPulseV2Phase1StabilitySoakAuthority } from '../stability-soak/phase-1-stability-soak-authority.js';
import { getDevPulseV2TaskGovernor } from '../task-governor/task-governor.js';
import {
  calculateTrustScore,
  deriveTrustConfidence,
  deriveTrustStatus,
  runFoundationTrustChecks,
} from './foundation-trust-checks.js';
import { formatTrustEngineReport } from './trust-engine-report.js';
import type { TrustEvidence, TrustResult } from './types.js';
import { TRUST_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2TrustEngineAuthority | null = null;

function createTrustId(): string {
  return `trust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEvidenceId(prefix: string): string {
  return `ev-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export class DevPulseV2TrustEngineAuthority {
  private lastResult: TrustResult | null = null;

  static readonly ownerModule = TRUST_OWNER_MODULE;
  static readonly ownerDomain = 'trust_engine' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('trust_engine');
    return owner.ownerModule === TRUST_OWNER_MODULE;
  }

  getLastResult(): TrustResult | null {
    return this.lastResult
      ? {
          ...this.lastResult,
          checks: [...this.lastResult.checks],
          evidence: [...this.lastResult.evidence],
          warnings: [...this.lastResult.warnings],
          errors: [...this.lastResult.errors],
        }
      : null;
  }

  /**
   * Observe existing authorities and score trust. Non-blocking — does not intercept chat.
   */
  async evaluateTrust(): Promise<TrustResult> {
    const createdAt = Date.now();
    const trustId = createTrustId();
    const evidence: TrustEvidence[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    warnings.push(
      'Trust Engine observes and scores only — it does not become answer authority or replace browser harness.',
    );

    const constitutional = runDevPulseV2ConstitutionalValidation({
      phase: 2,
      answerAuthorities: ['devpulse_v2_chat_authority'],
    });
    evidence.push({
      evidenceId: createEvidenceId('foundation'),
      source: 'FOUNDATION_ENFORCEMENT',
      summary: constitutional.passed
        ? `Constitutional validation PASS (${constitutional.violationCount} violations)`
        : `Constitutional validation FAIL (${constitutional.violationCount} violations)`,
      capturedAt: Date.now(),
    });

    const harness = getDevPulseV2BrowserVerificationHarness();
    const browserResult = await harness.runFoundationVerification('Trust engine observation');
    evidence.push({
      evidenceId: createEvidenceId('browser'),
      source: 'BROWSER_VERIFICATION',
      summary: `Harness ${browserResult.status} via ${browserResult.runnerUsed}; real=${harness.isRealBrowserRunnerAttached()}; checks=${browserResult.checks.length}`,
      capturedAt: Date.now(),
    });

    const shell = getDevPulseV2ShellAuthority();
    const shellState = shell.getState();
    const shellUsage = shell.getGovernorUsage();
    evidence.push({
      evidenceId: createEvidenceId('shell'),
      source: 'SHELL_AUTHORITY',
      summary: `Shell ${shellState.status}; visible=${shellState.visibleMs ?? 'n/a'}ms; clickable=${shellState.clickableMs ?? 'n/a'}ms`,
      capturedAt: Date.now(),
    });

    const chat = getDevPulseV2ChatAuthority();
    const lastAnswer = chat.getLastAnswer();
    const chatUsage = chat.getGovernorUsage();
    const feedEvents = chat.getActiveTurnFeedEvents();
    evidence.push({
      evidenceId: createEvidenceId('chat'),
      source: 'CHAT_AUTHORITY',
      summary: `Chat ${chat.getState().status}; answer=${lastAnswer?.status ?? 'none'}; messages=${chat.getState().messages.length}`,
      capturedAt: Date.now(),
    });

    evidence.push({
      evidenceId: createEvidenceId('feed'),
      source: 'INLINE_OPERATOR_FEED',
      summary: `Feed events=${feedEvents.length}; stages=${FOUNDATION_FEED_STAGES.map((s) => s.stage).join('→')}`,
      capturedAt: Date.now(),
    });

    const governor = getDevPulseV2TaskGovernor();
    const governorReport = governor.getReport();
    evidence.push({
      evidenceId: createEvidenceId('governor'),
      source: 'TASK_GOVERNOR',
      summary: `Governor responsiveness=${governorReport.responsivenessState}; completed=${governorReport.completedCount}; chat P0=${chatUsage.p0Tasks} P1=${chatUsage.p1Tasks}; shell P0=${shellUsage.p0Tasks}`,
      capturedAt: Date.now(),
    });

    const soakState = getDevPulseV2Phase1StabilitySoakAuthority().getState();
    const soakFoundationReady = soakState.phase2Readiness === 'FOUNDATION_READY';

    const visibleAnswerText = lastAnswer?.visibleAnswerText ?? FOUNDATION_RESPONSE_TEXT;
    const shellVisible =
      shellState.status === 'VISIBLE' ||
      shellState.status === 'CLICKABLE' ||
      shellState.status === 'READY';
    const shellClickable =
      shellState.status === 'CLICKABLE' || shellState.status === 'READY';

    const checks = runFoundationTrustChecks({
      evidence,
      shellVisible,
      shellClickable,
      shellVisibleMs: shellState.visibleMs ?? null,
      shellClickableMs: shellState.clickableMs ?? null,
      singleAnswerAuthority: assertSingleAnswerAuthorityRegistered(),
      visibleAnswerTextUsed:
        lastAnswer !== null &&
        lastAnswer.status === 'READY' &&
        lastAnswer.visibleAnswerText.trim().length > 0,
      visibleAnswerText,
      inlineFeedVisible:
        feedEvents.length === FOUNDATION_FEED_STAGES.length &&
        feedEvents.every((e) => e.visibleText.trim().length > 0),
      feedEventCount: feedEvents.length,
      feedDistinctFromAnswer:
        lastAnswer !== null &&
        feedEventsAreNotAssistantAnswers(feedEvents, lastAnswer),
      realBrowserAttached: harness.isRealBrowserRunnerAttached(),
      soakFoundationReady,
      taskGovernorUsedForVisiblePath:
        chatUsage.usedTaskGovernor &&
        (chatUsage.p0Tasks > 0 || chatUsage.p1Tasks > 0),
      foundationEnforcementPassed: constitutional.passed,
    });

    if (!soakFoundationReady) {
      warnings.push(
        `Phase 1 soak readiness is ${soakState.phase2Readiness} — not yet FOUNDATION_READY.`,
      );
    }

    if (!harness.isRealBrowserRunnerAttached()) {
      warnings.push('Real browser runner not attached — trust score reflects simulated browser evidence.');
    }

    const trustScore = calculateTrustScore(checks);
    const confidence = deriveTrustConfidence(trustScore, checks);
    const status = deriveTrustStatus(checks);

    const result: TrustResult = {
      trustId,
      createdAt,
      status,
      trustScore,
      confidence,
      checks,
      evidence,
      warnings,
      errors,
    };

    this.lastResult = result;
    return result;
  }

  formatReport(): string {
    if (!this.lastResult) {
      return 'No trust evaluation yet.';
    }
    return formatTrustEngineReport(this.lastResult);
  }

  /** Trust Engine must not replace browser harness ownership. */
  static assertDoesNotOwnBrowserHarness(): boolean {
    const harnessOwner = getDevPulseV2Owner('browser_verification_harness');
    return harnessOwner.ownerModule === HARNESS_OWNER_MODULE;
  }
}

export function createDevPulseV2TrustEngineAuthority(): DevPulseV2TrustEngineAuthority {
  singleton = new DevPulseV2TrustEngineAuthority();
  return singleton;
}

export function getDevPulseV2TrustEngineAuthority(): DevPulseV2TrustEngineAuthority {
  if (!singleton) {
    singleton = new DevPulseV2TrustEngineAuthority();
  }
  return singleton;
}

export function resetDevPulseV2TrustEngineAuthorityForTests(): DevPulseV2TrustEngineAuthority {
  singleton = new DevPulseV2TrustEngineAuthority();
  return singleton;
}
