/**
 * Evidence collection for End-to-End Build Reality Engine V1.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { E2EBuildRealityEvidence, E2EContractExpectationBundle } from './e2e-build-reality-types.js';
import type { E2EInteractionReplayStep } from './e2e-dom-reality-runner.js';

export async function collectBuildRealityEvidence(input: {
  projectRootDir: string;
  projectId: string;
  prompt: string;
  workspaceDir: string | null;
  previewUrl: string | null;
  expectations: E2EContractExpectationBundle;
  page?: {
    content(): Promise<string>;
    screenshot(options: { path: string; fullPage?: boolean }): Promise<void>;
    evaluate<T>(fn: () => T): Promise<T>;
  } | null;
  mountedFeatureModules: string[];
  genericShellDetected: boolean;
  interactionReplay?: E2EInteractionReplayStep[];
  workspaceRealityAuditPath?: string | null;
  featureRealityPath?: string | null;
  runtimeTruthSnapshot?: Record<string, unknown> | null;
}): Promise<E2EBuildRealityEvidence> {
  const evidenceDir = join(input.projectRootDir, '.end-to-end-build-reality', input.projectId);
  mkdirSync(evidenceDir, { recursive: true });

  let domSnapshotPath: string | null = null;
  let screenshotPath: string | null = null;
  let previewHash: string | null = null;
  let previewWorkspaceHash: string | null = null;
  let interactionReplayPath: string | null = null;
  let mountedComponentTreePath: string | null = null;
  let runtimeTruthPath: string | null = null;

  if (input.page) {
    const html = await input.page.content();
    domSnapshotPath = join(evidenceDir, 'dom-snapshot.html');
    writeFileSync(domSnapshotPath, html, 'utf8');
    previewHash = createHash('sha256').update(html).digest('hex').slice(0, 16);
    previewWorkspaceHash = await input.page.evaluate(() => {
      const meta = document.querySelector('meta[name="aidevengine-workspace-hash"]');
      return meta?.getAttribute('content') ?? null;
    });

    screenshotPath = join(evidenceDir, 'preview-screenshot.png');
    await input.page.screenshot({ path: screenshotPath, fullPage: true });

    const mountedTree = await input.page.evaluate(() => {
      const features = [...document.querySelectorAll('[data-feature-module]')].map((el) => ({
        moduleId: el.getAttribute('data-feature-module') ?? '',
        tagName: el.tagName.toLowerCase(),
        className: el.className,
      }));
      const rootFeatures = [...document.querySelectorAll('[data-root-feature]')].map((el) => ({
        moduleId: el.getAttribute('data-root-feature') ?? '',
        tagName: el.tagName.toLowerCase(),
      }));
      const routes = [...document.querySelectorAll('[data-modular-feature-v1]')].length;
      return {
        features,
        rootFeatures,
        modularSurfaces: routes,
        title: document.title,
        bodyText: document.body?.innerText?.slice(0, 2000) ?? '',
      };
    });
    mountedComponentTreePath = join(evidenceDir, 'mounted-component-tree.json');
    writeFileSync(mountedComponentTreePath, `${JSON.stringify(mountedTree, null, 2)}\n`, 'utf8');
  } else if (input.previewUrl) {
    try {
      const res = await fetch(input.previewUrl);
      const html = await res.text();
      previewHash = createHash('sha256').update(html).digest('hex').slice(0, 16);
      const metaMatch = html.match(
        /<meta[^>]+name=["']aidevengine-workspace-hash["'][^>]+content=["']([^"']+)["']/i,
      );
      previewWorkspaceHash = metaMatch?.[1] ?? null;
      domSnapshotPath = join(evidenceDir, 'dom-snapshot.html');
      writeFileSync(domSnapshotPath, html, 'utf8');
    } catch {
      /* preview fetch failed */
    }
  }

  if (input.interactionReplay?.length) {
    interactionReplayPath = join(evidenceDir, 'interaction-replay.json');
    writeFileSync(
      interactionReplayPath,
      `${JSON.stringify({ steps: input.interactionReplay }, null, 2)}\n`,
      'utf8',
    );
  }

  if (input.runtimeTruthSnapshot) {
    runtimeTruthPath = join(evidenceDir, 'runtime-truth.json');
    writeFileSync(runtimeTruthPath, `${JSON.stringify(input.runtimeTruthSnapshot, null, 2)}\n`, 'utf8');
  }

  const routeTablePath = join(evidenceDir, 'route-table.json');
  writeFileSync(
    routeTablePath,
    `${JSON.stringify({ routes: input.expectations.routes, featureModules: input.expectations.featureModules }, null, 2)}\n`,
    'utf8',
  );

  const featureRegistryPath = input.workspaceDir
    ? join(input.workspaceDir, 'src/features/registry.ts')
    : null;
  const universalFeatureContractPath = input.workspaceDir
    ? join(input.workspaceDir, 'universal-feature-contract.json')
    : null;
  const buildContractPath = input.workspaceDir
    ? join(input.workspaceDir, 'feature-contract.json')
    : null;

  return {
    readOnly: true,
    collectedAt: new Date().toISOString(),
    prompt: input.prompt,
    projectId: input.projectId,
    workspacePath: input.workspaceDir,
    previewUrl: input.previewUrl,
    screenshotPath: existsSync(screenshotPath ?? '') ? screenshotPath : null,
    domSnapshotPath,
    mountedComponentTreePath,
    routeTablePath,
    featureRegistryPath: featureRegistryPath && existsSync(featureRegistryPath) ? featureRegistryPath : null,
    runtimeTruthPath,
    workspaceRealityAuditPath: input.workspaceRealityAuditPath ?? null,
    featureRealityPath: input.featureRealityPath ?? null,
    workspaceHash: input.expectations.workspaceHash,
    previewHash,
    previewWorkspaceHash,
    buildContractPath: buildContractPath && existsSync(buildContractPath) ? buildContractPath : null,
    universalFeatureContractPath:
      universalFeatureContractPath && existsSync(universalFeatureContractPath)
        ? universalFeatureContractPath
        : null,
    interactionReplayPath,
    mountedFeatureModules: input.mountedFeatureModules,
    genericShellDetected: input.genericShellDetected,
  };
}
