/**
 * Connected Preview Experience Proof — preview experience proof authority.
 * Read-only — assesses preview evidence; does not launch preview.
 */

import { createHash } from 'node:crypto';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import {
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN,
} from './connected-preview-experience-proof-registry.js';
import { recordPreviewExperienceProofAssessment } from './connected-preview-experience-proof-history.js';
import { buildPreviewExperienceProofReportMarkdown } from './connected-preview-experience-proof-report-builder.js';
import type {
  AssessConnectedPreviewExperienceProofInput,
  PreviewActivationEvidence,
  PreviewExperienceFounderQuestions,
  PreviewExperienceProofAssessment,
  PreviewExperienceProofArtifacts,
  PreviewExperienceProofReport,
  PreviewExperienceState,
  PreviewProofLevel,
} from './connected-preview-experience-proof-types.js';
import { activatePreviewProofGap } from './preview-proof-gap-activator.js';
import { analyzePreviewCapture } from './preview-capture-analyzer.js';
import { analyzePreviewInteraction, isPreviewInteractive } from './preview-interaction-analyzer.js';
import { analyzePreviewLinkage } from './preview-linkage-analyzer.js';
import { analyzePreviewManifest } from './preview-manifest-analyzer.js';
import { analyzePreviewRender, isApplicationRendered } from './preview-render-analyzer.js';
import { analyzePreviewSession, isSessionObserved } from './preview-session-analyzer.js';
import { analyzePreviewUrl, isPreviewUrlReachable } from './preview-url-analyzer.js';

let assessmentCounter = 0;

export function resetPreviewExperienceProofCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `connected-preview-experience-proof-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: PreviewProofLevel): string {
  const digest = createHash('sha256')
    .update([CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_PREVIEW_EXPERIENCE_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveRuntimeActivationProof(
  input: AssessConnectedPreviewExperienceProofInput,
  rootDir: string,
): RuntimeActivationProofReport | null {
  if (input.runtimeActivationProof !== undefined) {
    return input.runtimeActivationProof;
  }
  return assessConnectedRuntimeActivationProof({ rootDir }).report;
}

function derivePreviewState(input: {
  sessionObserved: boolean;
  urlReachable: boolean;
  rendered: boolean;
  interactive: boolean;
}): PreviewExperienceState {
  if (input.interactive && input.rendered) return 'INTERACTIVE';
  if (input.rendered) return 'RENDERED';
  if (input.urlReachable) return 'URL_REACHABLE';
  if (input.sessionObserved) return 'SESSION_OBSERVED';
  return 'NOT_STARTED';
}

function deriveProofLevel(input: {
  runtimeProven: boolean;
  urlExists: boolean;
  urlReachable: boolean;
  rendered: boolean;
  linkageConnected: boolean;
}): PreviewProofLevel {
  if (
    input.runtimeProven &&
    input.urlExists &&
    input.urlReachable &&
    input.rendered &&
    input.linkageConnected
  ) {
    return 'PROVEN';
  }
  if (input.urlExists || input.urlReachable || input.rendered) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

function buildEmptyActivationEvidence(reason: string): PreviewActivationEvidence {
  return {
    readOnly: true,
    workspaceId: 'none',
    workspacePath: 'none',
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
    firstBrokenPreviewLink: reason.includes('RUNTIME') ? 'runtime→url' : 'runtime→url',
  };
}

function buildEmptyReport(assessmentId: string, reason: string): PreviewExperienceProofReport {
  const emptySession = {
    readOnly: true as const,
    sessionState: 'NOT_OBSERVED' as const,
    sessionObserved: false,
    sessionId: null,
    workspaceLinked: false,
    runtimeLinked: false,
    previewTimestamp: null,
    previewSource: null,
    confidence: 0,
  };
  const emptyUrl = {
    readOnly: true as const,
    urlState: 'NOT_OBSERVED' as const,
    urlObserved: false,
    urlReachable: false,
    previewUrl: null,
    host: null,
    port: null,
    protocol: null,
    confidence: 0,
  };
  const emptyRender = {
    readOnly: true as const,
    renderState: 'NOT_RENDERED' as const,
    renderObserved: false,
    applicationRendered: false,
    renderEvidence: [] as string[],
    applicationTitle: null,
    applicationRoot: null,
    confidence: 0,
  };
  const emptyInteraction = {
    readOnly: true as const,
    interactionState: 'NOT_INTERACTIVE' as const,
    interactionObserved: false,
    interactiveElements: [] as string[],
    interactionEvidence: [] as string[],
    confidence: 0,
  };
  const emptyCapture = {
    readOnly: true as const,
    captureState: 'NOT_CAPTURED' as const,
    captureObserved: false,
    captureCount: 0,
    capturePaths: [] as string[],
    confidence: 0,
  };
  const emptyManifest = {
    readOnly: true as const,
    manifestExists: false,
    runtimeLinked: false,
    workspaceLinked: false,
    previewLinked: false,
    contractLinked: false,
    traceabilityScore: 0,
  };
  const emptyLinkage = {
    readOnly: true as const,
    previewLinkageConnected: false,
    firstBrokenPreviewLink: 'contract→workspace',
    missingLinks: [reason],
    traceabilityScore: 0,
    contractToWorkspace: false,
    workspaceToRuntime: false,
    runtimeToPreviewSession: false,
    previewSessionToUrl: false,
    urlToRender: false,
    renderToInteraction: false,
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    previewProofLevel: 'NOT_PROVEN',
    previewState: 'NOT_STARTED',
    runtimeActivationProven: false,
    session: emptySession,
    url: emptyUrl,
    render: emptyRender,
    interaction: emptyInteraction,
    captures: emptyCapture,
    manifest: emptyManifest,
    linkage: emptyLinkage,
    missingEvidence: [reason],
    recommendedFix: 'Prove runtime activation before preview experience assessment.',
    recommendedNextActions: ['Complete RUNTIME activation proof first.'],
    founderQuestions: {
      readOnly: true,
      canFounderSeeApp: false,
      canFounderInteractWithApp: false,
      whatPreviewEvidenceExists: [],
      whatEvidenceMissing: [reason],
      whatShouldBeBuiltNext: ['Complete RUNTIME activation proof first.'],
    },
    activationEvidence: buildEmptyActivationEvidence(reason),
    cacheKey: stableCacheKey(assessmentId, 'NOT_PROVEN'),
  };
}

export function assessConnectedPreviewExperienceProof(
  input: AssessConnectedPreviewExperienceProofInput = {},
): PreviewExperienceProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const runtimeActivationProof = resolveRuntimeActivationProof(input, rootDir);
  const runtimeProven = runtimeActivationProof?.runtimeProofLevel === 'PROVEN';

  if (!runtimeActivationProof || !runtimeProven) {
    const reason = !runtimeActivationProof
      ? 'No runtime activation proof report available'
      : `Runtime activation proof level: ${runtimeActivationProof.runtimeProofLevel} (PROVEN required for preview proof)`;
    const report = buildEmptyReport(assessmentId, reason);
    const assessment: PreviewExperienceProofAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'PREVIEW_EXPERIENCE_PROOF_COMPLETE',
      report,
    };
    recordPreviewExperienceProofAssessment(assessment);
    return assessment;
  }

  const sessionEvidence = input.previewSessionEvidence;
  let activationEvidence: PreviewActivationEvidence | null = null;
  let resolvedSessionEvidence = sessionEvidence;

  const workspacePath =
    runtimeActivationProof.command.workingDirectory ??
    runtimeActivationProof.activationEvidence?.workspacePath ??
    null;
  const workspaceId =
    runtimeActivationProof.activationEvidence?.workspaceId ??
    workspacePath?.split('/').pop() ??
    'unknown';

  const shouldActivateGap =
    resolvedSessionEvidence === undefined &&
    input.skipPreviewProofGapActivation !== true &&
    workspacePath !== null;

  if (shouldActivateGap) {
    const activation = activatePreviewProofGap({
      projectRootDir: rootDir,
      workspacePath,
      workspaceId,
      runtimeActivationProof,
    });
    activationEvidence = activation.activationEvidence;
    if (activation.sessionEvidence) {
      resolvedSessionEvidence = activation.sessionEvidence;
    }
  }

  const session = analyzePreviewSession({ runtimeActivationProof, sessionEvidence: resolvedSessionEvidence });
  const url = analyzePreviewUrl({ runtimeActivationProof, session, sessionEvidence: resolvedSessionEvidence });
  const render = analyzePreviewRender({ url, sessionEvidence: resolvedSessionEvidence });
  const interaction = analyzePreviewInteraction({ render, sessionEvidence: resolvedSessionEvidence });
  const captures = analyzePreviewCapture({ sessionEvidence: resolvedSessionEvidence });
  const manifest = analyzePreviewManifest({ runtimeActivationProof, session, url });
  const linkage = analyzePreviewLinkage({
    runtimeActivationProof,
    session,
    url,
    render,
    interaction,
  });

  const sessionObserved = isSessionObserved(session);
  const urlReachable = isPreviewUrlReachable(url);
  const rendered = isApplicationRendered(render);
  const interactive = isPreviewInteractive(interaction);

  const previewState = derivePreviewState({
    sessionObserved,
    urlReachable,
    rendered,
    interactive,
  });

  const previewProofLevel = deriveProofLevel({
    runtimeProven,
    urlExists: url.previewUrl !== null,
    urlReachable,
    rendered,
    linkageConnected: linkage.previewLinkageConnected,
  });

  const missingEvidence: string[] = [
    ...linkage.missingLinks,
    ...(url.previewUrl === null ? ['Preview URL not detected'] : []),
    ...(!urlReachable ? ['Preview URL not reachable'] : []),
    ...(!rendered ? ['Application render evidence missing'] : []),
  ];

  let recommendedFix =
    'Open preview from running application and capture session, render, and interaction evidence.';
  if (previewProofLevel === 'PROVEN') {
    recommendedFix = 'Preview experience proven — proceed to VERIFY execution proof.';
  } else if (urlReachable && !rendered) {
    recommendedFix = 'Preview URL reachable but render evidence missing — capture DOM or HTML response.';
  } else if (rendered && !interactive) {
    recommendedFix = 'Application rendered but interaction evidence missing — record clickable elements or navigation.';
  } else if (!sessionObserved) {
    recommendedFix = 'No preview session observed — start preview from materialized runtime workspace.';
  } else if (!urlReachable) {
    recommendedFix = 'Preview session exists but URL not reachable — verify preview host/port binding.';
  } else if (!linkage.previewLinkageConnected && linkage.firstBrokenPreviewLink) {
    recommendedFix = `Fix broken preview link ${linkage.firstBrokenPreviewLink} before claiming PREVIEW proven.`;
  }

  const whatPreviewEvidenceExists: string[] = [];
  if (sessionObserved) whatPreviewEvidenceExists.push(`Preview session: ${session.sessionId}`);
  if (url.previewUrl) whatPreviewEvidenceExists.push(`Preview URL: ${url.previewUrl}`);
  if (rendered) whatPreviewEvidenceExists.push('Application render observed');
  if (interactive) whatPreviewEvidenceExists.push('Interaction evidence observed');
  if (captures.captureObserved) {
    whatPreviewEvidenceExists.push(`${captures.captureCount} capture(s)`);
  }

  const founderQuestions: PreviewExperienceFounderQuestions = {
    readOnly: true,
    canFounderSeeApp: rendered && urlReachable,
    canFounderInteractWithApp: interactive,
    whatPreviewEvidenceExists,
    whatEvidenceMissing: [...new Set(missingEvidence)].slice(0, 10),
    whatShouldBeBuiltNext:
      previewProofLevel === 'PROVEN'
        ? ['Connect preview session to verification execution proof.']
        : [recommendedFix],
  };

  const report: PreviewExperienceProofReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    previewProofLevel,
    previewState,
    runtimeActivationProven: runtimeProven,
    session,
    url,
    render,
    interaction,
    captures,
    manifest,
    linkage,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    recommendedFix,
    recommendedNextActions: founderQuestions.whatShouldBeBuiltNext,
    founderQuestions,
    activationEvidence:
      activationEvidence ??
      (resolvedSessionEvidence
        ? {
            readOnly: true,
            workspaceId,
            workspacePath: workspacePath ?? 'none',
            previewUrl: url.previewUrl,
            runtimePort: url.port,
            previewDetected: url.urlObserved,
            generatedAt: new Date().toISOString(),
            urlChecked: resolvedSessionEvidence.urlChecked ?? url.urlObserved,
            httpStatus: resolvedSessionEvidence.responseCode ?? null,
            reachable: urlReachable,
            checkedAt: resolvedSessionEvidence.checkedAt ?? null,
            renderEvidenceType: resolvedSessionEvidence.renderEvidenceType ?? null,
            renderObserved: rendered,
            responseLength: resolvedSessionEvidence.responseLength ?? null,
            contentType: resolvedSessionEvidence.contentType ?? null,
            renderCheckedAt: resolvedSessionEvidence.renderCheckedAt ?? null,
            proofLevel: previewProofLevel,
            firstBrokenPreviewLink: linkage.previewLinkageConnected
              ? null
              : linkage.firstBrokenPreviewLink,
          }
        : buildEmptyActivationEvidence('Preview activation not attempted')),
    cacheKey: stableCacheKey(assessmentId, previewProofLevel),
  };

  const assessment: PreviewExperienceProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'PREVIEW_EXPERIENCE_PROOF_COMPLETE',
    report,
  };

  recordPreviewExperienceProofAssessment(assessment);
  return assessment;
}

export function buildPreviewExperienceProofArtifacts(
  input: AssessConnectedPreviewExperienceProofInput = {},
): PreviewExperienceProofArtifacts {
  const previewExperienceProofAssessment = assessConnectedPreviewExperienceProof(input);
  return {
    previewExperienceProofAssessment,
    previewExperienceProofReportMarkdown: buildPreviewExperienceProofReportMarkdown(
      previewExperienceProofAssessment.report,
    ),
  };
}

export function resetConnectedPreviewExperienceProofModuleForTests(): void {
  resetPreviewExperienceProofCounterForTests();
}
