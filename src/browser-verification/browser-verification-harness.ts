/**
 * DevPulse V2 Browser Verification Harness — verifies Phase 1 stack in browser reality.
 * Does NOT own Shell, Chat, or Feed — observes and checks them.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  createDevPulseV2ChatAuthority,
  resetDevPulseV2ChatAuthorityForTests,
} from '../chat/chat-authority.js';
import { FOUNDATION_RESPONSE_TEXT } from '../chat/types.js';
import {
  resetDevPulseV2InlineOperatorFeedAuthorityForTests,
} from '../operator-feed/index.js';
import {
  createDevPulseV2ShellAuthority,
  resetDevPulseV2ShellAuthorityForTests,
} from '../shell/shell-authority.js';
import { resetDevPulseV2TaskGovernorForTests } from '../task-governor/task-governor.js';
import { formatBrowserVerificationReport } from './browser-verification-report.js';
import {
  deriveVerificationStatus,
  runFoundationBrowserChecks,
} from './foundation-checks.js';
import {
  createRealBrowserRunnerAdapter,
  getRealBrowserRunnerStatus,
} from './real-browser-runner-adapter.js';
import {
  createSimulatedBrowserDomAdapter,
  type SimulatedBrowserDomAdapter,
} from './simulated-browser-dom-adapter.js';
import type {
  BrowserRunnerMode,
  BrowserVerificationResult,
  RealBrowserRunnerStatus,
} from './types.js';
import { HARNESS_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2BrowserVerificationHarness | null = null;

function createVerificationId(): string {
  return `browser-verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DevPulseV2BrowserVerificationHarness {
  private dom: SimulatedBrowserDomAdapter = createSimulatedBrowserDomAdapter();
  private lastResult: BrowserVerificationResult | null = null;
  private runnerUsed: BrowserRunnerMode = 'simulated-html';
  private realBrowserRunnerStatus: RealBrowserRunnerStatus = 'PACKAGE_REQUIRED';
  private runnerInitialized = false;

  static readonly ownerModule = HARNESS_OWNER_MODULE;
  static readonly ownerDomain = 'browser_verification_harness' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('browser_verification_harness');
    return owner.ownerModule === HARNESS_OWNER_MODULE;
  }

  getDomAdapter(): SimulatedBrowserDomAdapter {
    return this.dom;
  }

  getLastResult(): BrowserVerificationResult | null {
    return this.lastResult ? { ...this.lastResult, checks: [...this.lastResult.checks] } : null;
  }

  getRunnerUsed(): BrowserRunnerMode {
    return this.runnerUsed;
  }

  getRealBrowserRunnerStatus(): RealBrowserRunnerStatus {
    return this.realBrowserRunnerStatus;
  }

  isRealBrowserRunnerAttached(): boolean {
    return this.runnerUsed === 'real-browser' && this.realBrowserRunnerStatus === 'ATTACHED';
  }

  private async initializeRunner(): Promise<void> {
    if (this.runnerInitialized) return;

    const adapter = await createRealBrowserRunnerAdapter();
    this.realBrowserRunnerStatus = adapter.status;

    if (adapter.status === 'ATTACHED') {
      this.runnerUsed = 'real-browser';
    } else {
      this.dom = createSimulatedBrowserDomAdapter();
      this.runnerUsed = 'simulated-html';
    }

    this.runnerInitialized = true;
  }

  /**
   * Boot full Phase 1 stack and run foundation browser checks.
   * Uses real Playwright when available; simulated HTML verification as fallback.
   */
  async runFoundationVerification(
    userMessage = 'Browser verification test message',
  ): Promise<BrowserVerificationResult> {
    await this.initializeRunner();

    const startedAt = Date.now();
    const verificationId = createVerificationId();
    const warnings: string[] = [];
    const errors: string[] = [];

    resetDevPulseV2TaskGovernorForTests();
    resetDevPulseV2ShellAuthorityForTests(startedAt);
    resetDevPulseV2InlineOperatorFeedAuthorityForTests(startedAt);
    resetDevPulseV2ChatAuthorityForTests(startedAt);

    const shell = createDevPulseV2ShellAuthority(startedAt);
    await shell.bootShell();

    const chat = createDevPulseV2ChatAuthority(startedAt);
    await chat.mountIntoShell();

    const answer = await chat.submitUserMessage(userMessage);

    const html = chat.getMountedShellHtml() ?? chat.getChatSurfaceHtml() ?? '';
    if (!html) {
      errors.push('No rendered HTML available for verification');
    }

    const shellState = shell.getState();
    const feedEvents = chat.getActiveTurnFeedEvents();
    const visibleAnswerText = answer.visibleAnswerText || FOUNDATION_RESPONSE_TEXT;

    let checks = runFoundationBrowserChecks({
      html,
      dom: this.dom,
      userMessageText: userMessage,
      visibleAnswerText,
      feedEventCount: feedEvents.length,
      shellVisibleMs: shellState.visibleMs ?? null,
      shellClickableMs: shellState.clickableMs ?? null,
    });

    if (this.runnerUsed === 'real-browser' && html) {
      const realAdapter = await createRealBrowserRunnerAdapter();
      const realResult = await realAdapter.verifyRenderedHtml(html, {
        userMessageText: userMessage,
        visibleAnswerText,
        feedEventCount: feedEvents.length,
      });

      warnings.push(...realResult.warnings);
      errors.push(...realResult.errors);

      if (realResult.checks.length > 0) {
        const supplemental = checks.filter((c) =>
          ['BV-10', 'BV-11', 'BV-12', 'BV-13'].includes(c.checkId),
        );
        checks = [...realResult.checks, ...supplemental];
      }
    } else {
      warnings.push(...this.dom.getAdapterWarnings());
      if (this.realBrowserRunnerStatus === 'PACKAGE_REQUIRED') {
        warnings.push('REAL_BROWSER_PACKAGE_REQUIRED');
      }
    }

    const status = deriveVerificationStatus(checks, warnings);

    const result: BrowserVerificationResult = {
      verificationId,
      startedAt,
      completedAt: Date.now(),
      status,
      checks,
      warnings,
      errors,
      runnerUsed: this.runnerUsed,
      realBrowserRunnerStatus: getRealBrowserRunnerStatus(),
    };

    this.lastResult = result;
    return result;
  }

  formatLastReport(): string {
    if (!this.lastResult) {
      return 'No verification run yet.';
    }
    return formatBrowserVerificationReport(
      this.lastResult,
      this.isRealBrowserRunnerAttached(),
    );
  }
}

export function createDevPulseV2BrowserVerificationHarness(): DevPulseV2BrowserVerificationHarness {
  singleton = new DevPulseV2BrowserVerificationHarness();
  return singleton;
}

export function getDevPulseV2BrowserVerificationHarness(): DevPulseV2BrowserVerificationHarness {
  if (!singleton) {
    singleton = new DevPulseV2BrowserVerificationHarness();
  }
  return singleton;
}

export function resetDevPulseV2BrowserVerificationHarnessForTests(): DevPulseV2BrowserVerificationHarness {
  singleton = new DevPulseV2BrowserVerificationHarness();
  return singleton;
}
