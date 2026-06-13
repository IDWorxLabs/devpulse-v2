/**
 * Preview Activation Engine — bounded real preview URL generation and probing (Phase 25.29).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join, resolve, sep } from 'node:path';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  executeRuntimeActivation,
} from '../connected-runtime-execution/runtime-activation-engine.js';
import {
  DEFAULT_PREVIEW_PORT,
  MAX_PREVIEW_ARTIFACTS,
  MAX_PREVIEW_DIAGNOSTICS,
  MAX_PREVIEW_EVIDENCE,
  MAX_PREVIEW_WARNINGS,
  PREVIEW_PROBE_TIMEOUT_MS,
} from './connected-live-preview-execution-registry.js';
import type {
  ExecutePreviewActivationInput,
  ExecutePreviewActivationResult,
  PreviewActivationEvidence,
  PreviewArtifactEntry,
  PreviewDiagnosticEntry,
  PreviewEvidenceEntry,
} from './connected-live-preview-execution-types.js';

let evidenceCounter = 0;
let previewCounter = 0;

export function resetPreviewActivationEngineForTests(): void {
  evidenceCounter = 0;
  previewCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `preview-activation-evidence-${evidenceCounter}`;
}

function nextPreviewId(): string {
  previewCounter += 1;
  return `connected-preview-${previewCounter}`;
}

function buildEvidence(
  evidenceType: string,
  summary: string,
  source: string,
): PreviewEvidenceEntry {
  return {
    readOnly: true,
    evidenceId: nextEvidenceId(),
    evidenceType,
    summary,
    source,
    inspectedAt: new Date().toISOString(),
  };
}

function isWorkspaceRootSafe(projectRootDir: string, workspaceRoot: string): boolean {
  const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
  return workspaceRoot.startsWith(generatedRoot + sep) || workspaceRoot === generatedRoot;
}

function readRuntimePort(workspaceRoot: string): number {
  const markerPath = join(workspaceRoot, '.runtime-activated.json');
  if (existsSync(markerPath)) {
    try {
      const parsed = JSON.parse(readFileSync(markerPath, 'utf8')) as { port?: number };
      if (typeof parsed.port === 'number' && parsed.port > 0) {
        return parsed.port;
      }
    } catch {
      // Fall through to default port.
    }
  }
  return DEFAULT_PREVIEW_PORT;
}

function detectPreviewArtifacts(workspaceRoot: string): string[] {
  const candidates = [
    '.preview-activated.json',
    '.preview-founder-metadata.json',
    '.runtime-activated.json',
    'dist/server.js',
    '.build-output.json',
  ];
  return candidates.filter((relative) => existsSync(join(workspaceRoot, relative)));
}

interface PreviewProbeResult {
  reachable: boolean;
  responseSuccessful: boolean;
  contentServed: boolean;
  statusCode: number;
  body: string;
  contentType: string | null;
}

function probePreviewUrl(previewUrl: string): Promise<PreviewProbeResult> {
  return new Promise((resolvePromise) => {
    const req = httpGet(previewUrl, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode ?? 0;
        const contentType = res.headers['content-type'] ?? null;
        let contentServed = body.trim().length > 0;
        let responseSuccessful = statusCode >= 200 && statusCode < 300;

        try {
          const parsed = JSON.parse(body) as { status?: string };
          if (parsed.status === 'ok') {
            contentServed = true;
          }
        } catch {
          contentServed = body.trim().length > 0;
        }

        resolvePromise({
          reachable: true,
          responseSuccessful,
          contentServed,
          statusCode,
          body: body.slice(0, 500),
          contentType,
        });
      });
    });
    req.on('error', () => {
      resolvePromise({
        reachable: false,
        responseSuccessful: false,
        contentServed: false,
        statusCode: 0,
        body: '',
        contentType: null,
      });
    });
    req.setTimeout(PREVIEW_PROBE_TIMEOUT_MS, () => {
      req.destroy();
      resolvePromise({
        reachable: false,
        responseSuccessful: false,
        contentServed: false,
        statusCode: 0,
        body: '',
        contentType: null,
      });
    });
  });
}

function emptyActivationEvidence(): PreviewActivationEvidence {
  return {
    readOnly: true,
    previewActivated: false,
    previewUrlGenerated: false,
    previewReachable: false,
    previewContentServed: false,
    previewArtifactsPresent: false,
    previewResponseSuccessful: false,
    previewEndpointAvailable: false,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-preview-activation-inspection',
  };
}

export async function executePreviewActivation(
  input: ExecutePreviewActivationInput,
): Promise<ExecutePreviewActivationResult> {
  const startMs = Date.now();
  const previewEvidence: PreviewEvidenceEntry[] = [];
  const previewWarnings: string[] = [];
  const previewDiagnostics: PreviewDiagnosticEntry[] = [];
  const blockingReasons: string[] = [];
  const previewArtifacts: PreviewArtifactEntry[] = [];
  const previewId = nextPreviewId();

  if (input.activationMode === 'BLOCKED' || input.activationMode === 'DRY_RUN') {
    return {
      success: false,
      previewId,
      previewUrl: '',
      previewArtifacts,
      previewEvidence,
      previewWarnings: [`Activation mode ${input.activationMode} — no preview endpoint activated.`],
      previewDiagnostics,
      activationEvidence: emptyActivationEvidence(),
      previewActivationDurationMs: 0,
      realPreviewLaunchPerformed: false,
      blockingReasons:
        input.activationMode === 'BLOCKED' ? ['Preview activation blocked by upstream gates.'] : [],
    };
  }

  if (!isWorkspaceRootSafe(input.projectRootDir, input.workspaceRoot)) {
    blockingReasons.push('Workspace root is outside generated builder workspaces.');
    return {
      success: false,
      previewId,
      previewUrl: '',
      previewArtifacts,
      previewEvidence: [
        buildEvidence('PATH_BLOCKED', 'Workspace root failed isolation check', 'preview-activation-engine'),
      ],
      previewWarnings,
      previewDiagnostics,
      activationEvidence: emptyActivationEvidence(),
      previewActivationDurationMs: Date.now() - startMs,
      realPreviewLaunchPerformed: false,
      blockingReasons,
    };
  }

  const startupArtifacts = detectPreviewArtifacts(input.workspaceRoot);
  const hasServerArtifact = existsSync(join(input.workspaceRoot, 'dist', 'server.js'));

  if (!hasServerArtifact) {
    blockingReasons.push('Startup artifact dist/server.js not found — runtime required for preview.');
    return {
      success: false,
      previewId,
      previewUrl: '',
      previewArtifacts,
      previewEvidence,
      previewWarnings,
      previewDiagnostics,
      activationEvidence: emptyActivationEvidence(),
      previewActivationDurationMs: Date.now() - startMs,
      realPreviewLaunchPerformed: false,
      blockingReasons,
    };
  }

  let port = input.runtimePort ?? readRuntimePort(input.workspaceRoot);
  let probe = await probePreviewUrl(`http://127.0.0.1:${port}/`);

  if (!probe.reachable) {
    previewWarnings.push('Runtime not reachable — attempting bounded runtime activation for preview.');
    const runtimeResult = await executeRuntimeActivation({
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      workspaceRoot: input.workspaceRoot,
      runtimeType: input.runtimeType,
      buildArtifacts: input.buildArtifacts,
      activationMode: 'REAL_ACTIVATION',
    });
    if (!runtimeResult.success) {
      blockingReasons.push('Runtime activation failed — preview cannot be exposed.');
      blockingReasons.push(...runtimeResult.blockingReasons);
      return {
        success: false,
        previewId,
        previewUrl: '',
        previewArtifacts,
        previewEvidence,
        previewWarnings,
        previewDiagnostics,
        activationEvidence: emptyActivationEvidence(),
        previewActivationDurationMs: Date.now() - startMs,
        realPreviewLaunchPerformed: false,
        blockingReasons,
      };
    }
    port = readRuntimePort(input.workspaceRoot);
    probe = await probePreviewUrl(`http://127.0.0.1:${port}/`);
  }

  const previewUrl = `http://127.0.0.1:${port}/`;
  previewEvidence.push(
    buildEvidence('PREVIEW_URL_GENERATED', previewUrl, 'preview-activation-engine'),
  );
  previewDiagnostics.push({
    readOnly: true,
    diagnosticId: 'preview-url',
    label: 'Preview URL',
    value: previewUrl,
    source: 'preview-activation-engine',
  });
  previewDiagnostics.push({
    readOnly: true,
    diagnosticId: 'preview-port',
    label: 'Preview port',
    value: String(port),
    source: 'preview-activation-engine',
  });

  if (probe.reachable) {
    previewEvidence.push(
      buildEvidence(
        'PREVIEW_REACHABLE',
        `HTTP ${probe.statusCode} from ${previewUrl}`,
        'preview-activation-engine',
      ),
    );
  } else {
    previewWarnings.push(`Preview URL not reachable: ${previewUrl}`);
  }

  if (probe.contentServed) {
    previewEvidence.push(
      buildEvidence(
        'PREVIEW_CONTENT_SERVED',
        `Body length=${probe.body.length} contentType=${probe.contentType ?? 'unknown'}`,
        'preview-activation-engine',
      ),
    );
  } else {
    previewWarnings.push('Preview endpoint did not serve content.');
  }

  if (probe.responseSuccessful) {
    previewEvidence.push(
      buildEvidence(
        'PREVIEW_RESPONSE_SUCCESS',
        `Status ${probe.statusCode} successful`,
        'preview-activation-engine',
      ),
    );
  }

  const previewActivationDurationMs = Date.now() - startMs;
  previewDiagnostics.push({
    readOnly: true,
    diagnosticId: 'activation-duration',
    label: 'Preview activation duration (ms)',
    value: String(previewActivationDurationMs),
    source: 'preview-activation-engine',
  });

  try {
    writeFileSync(
      join(input.workspaceRoot, '.preview-activated.json'),
      JSON.stringify(
        {
          previewId,
          workspaceId: input.workspaceId,
          previewType: input.previewType,
          previewUrl,
          port,
          activatedAt: new Date().toISOString(),
          previewActivationDurationMs,
          responseStatusCode: probe.statusCode,
          contentServed: probe.contentServed,
        },
        null,
        2,
      ),
      'utf8',
    );
    writeFileSync(
      join(input.workspaceRoot, '.preview-founder-metadata.json'),
      JSON.stringify(
        {
          previewId,
          previewUrl,
          founderViewable: true,
          viewableAt: new Date().toISOString(),
          workspaceId: input.workspaceId,
          previewType: input.previewType,
          isolationRoot: input.workspaceRoot,
        },
        null,
        2,
      ),
      'utf8',
    );
    previewArtifacts.push(
      { readOnly: true, path: '.preview-activated.json', category: 'PREVIEW_MARKER', sourceAuthority: 'connected-live-preview-execution' },
      { readOnly: true, path: '.preview-founder-metadata.json', category: 'FOUNDER_METADATA', sourceAuthority: 'connected-live-preview-execution' },
    );
    previewEvidence.push(
      buildEvidence('PREVIEW_MARKER_WRITTEN', 'Wrote preview activation markers', 'preview-activation-engine'),
    );
  } catch (err) {
    previewWarnings.push(`Failed to write preview markers: ${err instanceof Error ? err.message : String(err)}`);
  }

  for (const artifactPath of startupArtifacts.slice(0, MAX_PREVIEW_ARTIFACTS - previewArtifacts.length)) {
    if (!previewArtifacts.some((a) => a.path === artifactPath)) {
      previewArtifacts.push({
        readOnly: true,
        path: artifactPath,
        category: artifactPath.includes('preview') ? 'PREVIEW' : 'RUNTIME',
        sourceAuthority: 'connected-runtime-execution',
      });
    }
  }

  const previewArtifactsPresent =
    previewArtifacts.some((a) => a.path === '.preview-activated.json') &&
    existsSync(join(input.workspaceRoot, '.preview-founder-metadata.json'));

  const activationEvidence: PreviewActivationEvidence = {
    readOnly: true,
    previewActivated: probe.reachable && probe.contentServed,
    previewUrlGenerated: previewUrl.length > 0,
    previewReachable: probe.reachable,
    previewContentServed: probe.contentServed,
    previewArtifactsPresent,
    previewResponseSuccessful: probe.responseSuccessful,
    previewEndpointAvailable: probe.reachable && probe.responseSuccessful,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-preview-activation-inspection',
  };

  previewEvidence.push(
    buildEvidence(
      'PREVIEW_INSPECTION',
      `previewActivated=${activationEvidence.previewActivated} url=${previewUrl} content=${probe.contentServed}`,
      'real-preview-activation-inspection',
    ),
  );

  const success =
    blockingReasons.length === 0 &&
    activationEvidence.previewUrlGenerated &&
    activationEvidence.previewReachable &&
    activationEvidence.previewContentServed &&
    activationEvidence.previewResponseSuccessful &&
    activationEvidence.previewEndpointAvailable &&
    activationEvidence.previewArtifactsPresent;

  return {
    success,
    previewId,
    previewUrl,
    previewArtifacts: previewArtifacts.slice(0, MAX_PREVIEW_ARTIFACTS),
    previewEvidence: previewEvidence.slice(0, MAX_PREVIEW_EVIDENCE),
    previewWarnings: previewWarnings.slice(0, MAX_PREVIEW_WARNINGS),
    previewDiagnostics: previewDiagnostics.slice(0, MAX_PREVIEW_DIAGNOSTICS),
    activationEvidence,
    previewActivationDurationMs,
    realPreviewLaunchPerformed: success,
    blockingReasons,
  };
}
