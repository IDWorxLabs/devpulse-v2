/**
 * Shared one-prompt chat build proof checks — used by validators without nested npm spawns.
 */

import { join } from 'node:path';
import {
  ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN,
  parseViteDevServerUrl,
} from '../../src/one-prompt-live-preview/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { runNpmRunScriptSync } from '../../src/one-prompt-live-preview/child-process-teardown.js';

export const CHAT_BUILD_PROOF_PASS_TOKEN = `${ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN}_CHAT`;

export interface ChatBuildProofCheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ChatBuildProofRunResult {
  results: ChatBuildProofCheckResult[];
  passToken: string;
  passed: boolean;
}

const TASK_TRACKER_IDEA =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

function assert(
  results: ChatBuildProofCheckResult[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  results.push({ name, passed: condition, detail });
}

export async function runOnePromptChatBuildProofChecks(input: {
  rootDir: string;
  baseUrl: string;
  includeParserCheck?: boolean;
}): Promise<ChatBuildProofRunResult> {
  const results: ChatBuildProofCheckResult[] = [];

  if (input.includeParserCheck !== false) {
    assert(
      results,
      'vite ANSI output parser',
      parseViteDevServerUrl('\x1b[32m➜\x1b[39m  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://127.0.0.1:\x1b[1m5175\x1b[22m/\x1b[39m')?.port === 5175,
      '5175',
    );
  }

  const chatRes = await fetch(`${input.baseUrl}/api/brain/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: TASK_TRACKER_IDEA, timestamp: Date.now() }),
  });

  assert(results, 'chat HTTP not 500/502', chatRes.status < 500, `status ${chatRes.status}`);
  assert(results, 'chat HTTP 200', chatRes.status === 200, `status ${chatRes.status}`);

  const chatJson = (await chatRes.json()) as {
    category?: string;
    brainResponse?: string;
    onePromptLivePreview?: {
      status?: string;
      workspacePath?: string | null;
      generatedProfile?: string | null;
      previewUrl?: string | null;
      failureReason?: string | null;
      npmBuildOk?: boolean;
    };
    buildLivePreview?: { previewUrl?: string | null; connected?: boolean };
    operatorFeedEvents?: unknown[];
  };

  assert(results, 'chat category BUILD', chatJson.category === 'BUILD', chatJson.category ?? 'none');
  assert(results, 'chat brainResponse present', Boolean(chatJson.brainResponse), 'missing');
  assert(
    results,
    'chat operator feed events present',
    Array.isArray(chatJson.operatorFeedEvents) && chatJson.operatorFeedEvents.length >= 5,
    String(chatJson.operatorFeedEvents?.length ?? 0),
  );

  const build = chatJson.onePromptLivePreview;
  assert(results, 'onePromptLivePreview present', Boolean(build), 'missing');

  if (build?.status === 'READY') {
    assert(
      results,
      'generated profile TASK_TRACKER_WEB_V1',
      build.generatedProfile === 'TASK_TRACKER_WEB_V1',
      build.generatedProfile ?? 'none',
    );
    assert(
      results,
      'workspace created',
      Boolean(build.workspacePath?.includes(GENERATED_BUILDER_WORKSPACES_DIR)),
      build.workspacePath ?? 'none',
    );

    const workspaceDir = join(input.rootDir, (build.workspacePath ?? '').replace(/\//g, '\\'));
    const npmBuild = runNpmRunScriptSync({
      cwd: workspaceDir,
      script: 'build',
      timeoutMs: 180_000,
    });
    assert(
      results,
      'npm run build passes',
      npmBuild.status === 0,
      npmBuild.status === 0 ? 'exit 0' : (npmBuild.stderr ?? '').slice(0, 200),
    );

    const previewUrl = build.previewUrl ?? chatJson.buildLivePreview?.previewUrl ?? null;
    assert(results, 'live preview URL present', Boolean(previewUrl), previewUrl ?? 'none');
    if (previewUrl) {
      const htmlRes = await fetch(previewUrl);
      const html = await htmlRes.text();
      assert(
        results,
        'preview URL returns HTML',
        htmlRes.ok && /id="root"|Task Tracker|main\.tsx/i.test(html),
        `status ${htmlRes.status}`,
      );
    }
  } else {
    assert(
      results,
      'structured failureReason on failure',
      Boolean(build?.failureReason),
      build?.failureReason ?? 'none',
    );
  }

  const failed = results.filter((r) => !r.passed);
  return {
    results,
    passToken: failed.length === 0 ? CHAT_BUILD_PROOF_PASS_TOKEN : 'ONE_PROMPT_CHAT_BUILD_PROOF_FAIL',
    passed: failed.length === 0,
  };
}

export function formatChatBuildProofResults(results: ChatBuildProofCheckResult[]): string {
  return results.map((result) => `${result.passed ? '✓' : '✗'} ${result.name}: ${result.detail}`).join('\n');
}
