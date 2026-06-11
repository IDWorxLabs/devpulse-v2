/**
 * Command Center running-application responses — Phase 24.9.4.
 * Answers what is running using Running Application Visibility Authority. No fake certainty.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessRunningApplicationVisibilityFromWorkspace } from '../running-application-visibility/index.js';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export type RunningApplicationIntent =
  | 'WHAT_IS_RUNNING'
  | 'WHAT_APP_LOOKING_AT'
  | 'IS_LATEST_BUILD'
  | 'CAN_I_TEST'
  | 'DID_PREVIEW_UPDATE';

const RUNNING_APP_MATCHERS: ReadonlyArray<{ intent: RunningApplicationIntent; patterns: RegExp[] }> = [
  {
    intent: 'WHAT_IS_RUNNING',
    patterns: [
      /^what is running\??$/i,
      /^what app is running\??$/i,
      /^what(?:'s| is) currently running\??$/i,
    ],
  },
  {
    intent: 'WHAT_APP_LOOKING_AT',
    patterns: [
      /^what app am i looking at\??$/i,
      /^what application am i looking at\??$/i,
      /^which app is this\??$/i,
    ],
  },
  {
    intent: 'IS_LATEST_BUILD',
    patterns: [
      /^is this the latest build\??$/i,
      /^is this the current build\??$/i,
      /^is the preview current\??$/i,
    ],
  },
  {
    intent: 'CAN_I_TEST',
    patterns: [/^can i test this\??$/i, /^is it safe to test(?: now)?\??$/i, /^can i test now\??$/i],
  },
  {
    intent: 'DID_PREVIEW_UPDATE',
    patterns: [
      /^did the preview update\??$/i,
      /^has the preview updated\??$/i,
      /^did live preview update\??$/i,
    ],
  },
];

let cachedValidatorScripts: string[] | null = null;

function loadValidatorScripts(): string[] {
  if (cachedValidatorScripts) return cachedValidatorScripts;
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
    cachedValidatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  } catch {
    cachedValidatorScripts = [];
  }
  return cachedValidatorScripts;
}

export function matchRunningApplicationIntent(message: string): RunningApplicationIntent | null {
  const normalized = message.trim().replace(/\s+/g, ' ');
  for (const entry of RUNNING_APP_MATCHERS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return null;
}

function currentVisibility() {
  const workspace = buildProductWorkspaceSnapshot(loadValidatorScripts());
  return assessRunningApplicationVisibilityFromWorkspace(workspace);
}

function formatVisibilityBody(visibility: ReturnType<typeof currentVisibility>): string {
  const app = visibility.activeApplication;
  return [
    `Running application: ${visibility.runningAppTitle}`,
    `Output state: ${visibility.outputState}`,
    `Build output: ${visibility.buildOutput.outputType.replace(/_/g, ' ')} — ${visibility.buildOutput.lastBuildLabel}`,
    visibility.buildOutput.changeSummary ? `Change summary: ${visibility.buildOutput.changeSummary}` : '',
    `Request alignment: ${visibility.requestAlignment}`,
    `Reason: ${visibility.alignmentReason}`,
    `Testing status: ${visibility.testReadiness}`,
    `Testing note: ${visibility.testReadinessReason}`,
    visibility.warnings.length ? `Warnings: ${visibility.warnings.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function generateRunningApplicationResponse(intent: RunningApplicationIntent): string {
  const visibility = currentVisibility();

  switch (intent) {
    case 'WHAT_IS_RUNNING':
      return `${formatVisibilityBody(visibility)}\n\nNext action: ${visibility.recommendedAction}`;

    case 'WHAT_APP_LOOKING_AT': {
      const target = visibility.activeApplication.previewTargetName;
      const project = visibility.activeApplication.projectName;
      if (!target && !project) {
        return `No running application is active right now.\n\nOutput state: ${visibility.outputState}\n\nNext action: ${visibility.recommendedAction}`;
      }
      return [
        project ? `You are looking at ${project}.` : `Active preview target: ${target}.`,
        target ? `Preview target: ${target}` : '',
        `Output state: ${visibility.outputState}`,
        `Request alignment: ${visibility.requestAlignment}`,
        `Testing status: ${visibility.testReadiness}`,
        '',
        `Next action: ${visibility.recommendedAction}`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'IS_LATEST_BUILD':
      if (visibility.requestAlignment === 'ALIGNED') {
        return `Yes — the visible output appears aligned with the latest project state.\n\n${visibility.alignmentReason}\n\nNext action: ${visibility.recommendedAction}`;
      }
      if (visibility.requestAlignment === 'STALE') {
        return `No — the visible output appears stale.\n\n${visibility.alignmentReason}\n\nNext action: Restart preview or rebuild before relying on this view.`;
      }
      if (visibility.requestAlignment === 'UNKNOWN') {
        return `Unknown — I cannot fully confirm whether this is the latest build.\n\n${visibility.alignmentReason}\n\nNext action: ${visibility.recommendedAction}`;
      }
      return `Partially — output is visible, but latest build alignment is not fully confirmed.\n\n${visibility.alignmentReason}\n\nNext action: ${visibility.recommendedAction}`;

    case 'CAN_I_TEST':
      if (visibility.testReadiness === 'TESTABLE') {
        return `Yes — the running application is ready for meaningful testing.\n\n${visibility.testReadinessReason}\n\nNext action: ${visibility.recommendedAction}`;
      }
      if (visibility.testReadiness === 'TESTABLE_WITH_WARNINGS') {
        return `You can test with caution.\n\n${visibility.testReadinessReason}\n\nNext action: ${visibility.recommendedAction}`;
      }
      if (visibility.testReadiness === 'STALE_TEST_TARGET') {
        return `Not yet — the visible app may be stale.\n\n${visibility.testReadinessReason}\n\nNext action: Restart preview or rebuild, then test again.`;
      }
      return `Not yet — testing is not recommended right now.\n\n${visibility.testReadinessReason}\n\nNext action: ${visibility.recommendedAction}`;

    case 'DID_PREVIEW_UPDATE':
      if (visibility.outputState === 'NO_RUNNING_APP' || visibility.outputState === 'OUTPUT_STARTING') {
        return `No confirmed preview update yet.\n\nOutput state: ${visibility.outputState}\n\nNext action: ${visibility.recommendedAction}`;
      }
      if (visibility.requestAlignment === 'STALE') {
        return `A preview is visible, but it may not reflect the latest update.\n\n${visibility.alignmentReason}\n\nNext action: Refresh or restart preview.`;
      }
      return [
        `Latest output signal: ${visibility.buildOutput.changeSummary}`,
        `Output state: ${visibility.outputState}`,
        `Request alignment: ${visibility.requestAlignment}`,
        '',
        `Next action: ${visibility.recommendedAction}`,
      ].join('\n');

    default:
      return formatVisibilityBody(visibility);
  }
}

export function resolveRunningApplicationResponse(message: string): string | null {
  const intent = matchRunningApplicationIntent(message);
  if (!intent) return null;
  return generateRunningApplicationResponse(intent);
}
