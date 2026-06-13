/**
 * Preview Proof Gap Activator — bounded preview URL/render probing (Phase 26.75).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { PREVIEW_PROBE_TIMEOUT_MS } from './connected-preview-experience-proof-registry.js';
import type {
  PreviewActivationEvidence,
  PreviewProofLevel,
  PreviewSessionEvidence,
} from './connected-preview-experience-proof-types.js';
import { analyzePreviewLinkage } from './preview-linkage-analyzer.js';

export const CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS =
  'CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS';

const PROBE_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'preview-proof-gap-probe.mjs');

interface ProbeResult {
  workspaceId?: string;
  workspacePath?: string;
  previewUrl?: string | null;
  runtimePort?: number | null;
  previewDetected?: boolean;
  generatedAt?: string;
  urlChecked?: boolean;
  httpStatus?: number | null;
  responseCode?: number | null;
  reachable?: boolean;
  checkedAt?: string | null;
  renderEvidenceType?: string | null;
  renderObserved?: boolean;
  responseLength?: number;
  contentType?: string | null;
  renderCheckedAt?: string | null;
  htmlResponse?: boolean;
  applicationTitle?: string | null;
  applicationRoot?: string | null;
  proofLevel?: PreviewProofLevel;
  activationAttempted?: boolean;
  firstBrokenPreviewLink?: string | null;
  error?: string;
}

function emptyActivationEvidence(input: {
  workspaceId: string;
  workspacePath: string;
  firstBrokenPreviewLink: string | null;
}): PreviewActivationEvidence {
  return {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath: input.workspacePath,
    previewUrl: null,
    runtimePort: null,
    previewDetected: false,
    generatedAt: new Date().toISOString(),
    urlChecked: false,
    httpStatus: null,
    reachable: false,
    checkedAt: null,
    renderEvidenceType: null,
    renderObserved: false,
    responseLength: null,
    contentType: null,
    renderCheckedAt: null,
    proofLevel: 'NOT_PROVEN',
    firstBrokenPreviewLink: input.firstBrokenPreviewLink,
  };
}

function parseProbeStdout(stdout: string): ProbeResult | null {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as ProbeResult;
    } catch {
      // try previous line
    }
  }
  return null;
}

function probeToSessionEvidence(probe: ProbeResult, runtimeActivationProof: RuntimeActivationProofReport): PreviewSessionEvidence {
  return {
    previewSessionId: `preview-gap-${probe.workspaceId ?? 'unknown'}`,
    workspaceId: probe.workspaceId,
    runtimeSessionId: runtimeActivationProof.process.runtimeSessionId ?? undefined,
    previewTimestamp: probe.generatedAt ?? new Date().toISOString(),
    previewSource: 'preview-proof-gap-activator',
    previewUrl: probe.previewUrl ?? undefined,
    host: '127.0.0.1',
    port: probe.runtimePort ?? undefined,
    protocol: 'http',
    urlReachable: probe.reachable ?? false,
    urlChecked: probe.urlChecked ?? false,
    httpStatus: probe.httpStatus ?? undefined,
    responseCode: probe.responseCode ?? probe.httpStatus ?? undefined,
    responseLength: probe.responseLength,
    contentType: probe.contentType ?? undefined,
    renderEvidenceType: probe.renderEvidenceType ?? undefined,
    renderObserved: probe.renderObserved ?? false,
    renderCheckedAt: probe.renderCheckedAt ?? undefined,
    checkedAt: probe.checkedAt ?? undefined,
    htmlResponse: probe.htmlResponse ?? false,
    applicationTitle: probe.applicationTitle ?? undefined,
    applicationRoot: probe.applicationRoot ?? undefined,
    proofLevel: probe.proofLevel,
    generatedAt: probe.generatedAt ?? new Date().toISOString(),
  };
}

export function activatePreviewProofGap(input: {
  projectRootDir: string;
  workspacePath: string;
  workspaceId: string;
  runtimeActivationProof: RuntimeActivationProofReport;
}): {
  sessionEvidence: PreviewSessionEvidence | null;
  activationEvidence: PreviewActivationEvidence;
} {
  const workspacePath = input.workspacePath.replace(/\\/g, '/');
  const workspaceAbs = resolve(input.projectRootDir, workspacePath);

  if (input.runtimeActivationProof.runtimeProofLevel !== 'PROVEN') {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenPreviewLink: 'runtime→url',
      }),
    };
  }

  if (!isPathUnderGeneratedBuilderWorkspaces(input.projectRootDir, workspaceAbs)) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenPreviewLink: 'runtime→url',
      }),
    };
  }

  if (!existsSync(PROBE_SCRIPT)) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenPreviewLink: 'runtime→url',
      }),
    };
  }

  const result = spawnSync(process.execPath, [PROBE_SCRIPT, workspaceAbs, '0', input.workspaceId], {
    encoding: 'utf8',
    timeout: PREVIEW_PROBE_TIMEOUT_MS + 3000,
    windowsHide: true,
    env: {
      ...process.env,
      PREVIEW_PROBE_TIMEOUT_MS: String(PREVIEW_PROBE_TIMEOUT_MS),
    },
  });

  const probe = parseProbeStdout(result.stdout ?? '');
  if (!probe) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenPreviewLink: 'runtime→url',
      }),
    };
  }

  const sessionEvidence = probeToSessionEvidence(probe, input.runtimeActivationProof);
  const urlAssessment = {
    readOnly: true as const,
    urlState: probe.reachable ? ('REACHABLE' as const) : probe.previewUrl ? ('OBSERVED' as const) : ('NOT_OBSERVED' as const),
    urlObserved: Boolean(probe.previewUrl),
    urlReachable: probe.reachable ?? false,
    previewUrl: probe.previewUrl ?? null,
    host: '127.0.0.1',
    port: probe.runtimePort ?? null,
    protocol: 'http',
    confidence: probe.reachable ? 90 : 0,
  };
  const renderAssessment = {
    readOnly: true as const,
    renderState: probe.renderObserved ? ('RENDERED' as const) : ('NOT_RENDERED' as const),
    renderObserved: probe.renderObserved ?? false,
    applicationRendered: probe.renderObserved ?? false,
    renderEvidence: probe.renderEvidenceType ? [probe.renderEvidenceType] : [],
    applicationTitle: probe.applicationTitle ?? null,
    applicationRoot: probe.applicationRoot ?? null,
    confidence: probe.renderObserved ? 90 : 0,
  };
  const sessionAssessment = {
    readOnly: true as const,
    sessionState: 'OBSERVED' as const,
    sessionObserved: true,
    sessionId: sessionEvidence.previewSessionId ?? null,
    workspaceLinked: true,
    runtimeLinked: true,
    previewTimestamp: sessionEvidence.previewTimestamp ?? null,
    previewSource: sessionEvidence.previewSource ?? null,
    confidence: 90,
  };
  const interactionAssessment = {
    readOnly: true as const,
    interactionState: 'NOT_INTERACTIVE' as const,
    interactionObserved: false,
    interactiveElements: [] as string[],
    interactionEvidence: [] as string[],
    confidence: 0,
  };
  const linkage = analyzePreviewLinkage({
    runtimeActivationProof: input.runtimeActivationProof,
    session: sessionAssessment,
    url: urlAssessment,
    render: renderAssessment,
    interaction: interactionAssessment,
  });

  const proofLevel: PreviewProofLevel =
    probe.proofLevel ??
    (probe.previewDetected && probe.reachable && probe.renderObserved ? 'PROVEN' : 'PARTIAL');

  const activationEvidence: PreviewActivationEvidence = {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath,
    previewUrl: probe.previewUrl ?? null,
    runtimePort: probe.runtimePort ?? null,
    previewDetected: probe.previewDetected ?? false,
    generatedAt: probe.generatedAt ?? new Date().toISOString(),
    urlChecked: probe.urlChecked ?? false,
    httpStatus: probe.httpStatus ?? null,
    reachable: probe.reachable ?? false,
    checkedAt: probe.checkedAt ?? null,
    renderEvidenceType: probe.renderEvidenceType ?? null,
    renderObserved: probe.renderObserved ?? false,
    responseLength: probe.responseLength ?? null,
    contentType: probe.contentType ?? null,
    renderCheckedAt: probe.renderCheckedAt ?? null,
    proofLevel,
    firstBrokenPreviewLink: linkage.previewLinkageConnected ? null : linkage.firstBrokenPreviewLink,
  };

  return {
    sessionEvidence: probe.previewDetected ? sessionEvidence : null,
    activationEvidence,
  };
}
