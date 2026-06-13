/**
 * Preview Linkage Analyzer — verify runtime→preview experience chain.
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type {
  PreviewInteractionAssessment,
  PreviewLinkageAnalysis,
  PreviewRenderAssessment,
  PreviewSessionAssessment,
  PreviewUrlAssessment,
} from './connected-preview-experience-proof-types.js';
import { isPreviewInteractive } from './preview-interaction-analyzer.js';
import { isApplicationRendered } from './preview-render-analyzer.js';
import { isPreviewUrlReachable } from './preview-url-analyzer.js';
import { isSessionObserved } from './preview-session-analyzer.js';

export function analyzePreviewLinkage(input: {
  runtimeActivationProof: RuntimeActivationProofReport | null;
  session: PreviewSessionAssessment;
  url: PreviewUrlAssessment;
  render: PreviewRenderAssessment;
  interaction: PreviewInteractionAssessment;
}): PreviewLinkageAnalysis {
  const runtimeProven = input.runtimeActivationProof?.runtimeProofLevel === 'PROVEN';
  const workspaceExists =
    input.runtimeActivationProof?.buildMaterializationProven === true &&
    (input.session.workspaceLinked || input.url.previewUrl !== null);

  const contractToWorkspace = runtimeProven && workspaceExists;
  const workspaceToRuntime = contractToWorkspace && runtimeProven;
  const runtimeToUrl = workspaceToRuntime && input.url.previewUrl !== null;
  const urlToReachable = runtimeToUrl && isPreviewUrlReachable(input.url);
  const reachableToRender = urlToReachable && isApplicationRendered(input.render);

  const coreLinks = [
    { key: 'runtime→url', ok: runtimeToUrl },
    { key: 'url→reachable', ok: urlToReachable },
    { key: 'reachable→render', ok: reachableToRender },
  ];

  const missingLinks: string[] = [];
  let firstBrokenPreviewLink: string | null = null;
  for (const link of coreLinks) {
    if (!link.ok) {
      missingLinks.push(`Broken link: ${link.key}`);
      if (firstBrokenPreviewLink === null) firstBrokenPreviewLink = link.key;
    }
  }

  if (!runtimeProven) {
    missingLinks.unshift('Runtime activation not PROVEN — preview chain cannot start');
    if (firstBrokenPreviewLink === null) firstBrokenPreviewLink = 'runtime→url';
  }

  const passed = coreLinks.filter((l) => l.ok).length;
  const traceabilityScore = Math.round((passed / coreLinks.length) * 100);
  const previewLinkageConnected = coreLinks.every((l) => l.ok) && runtimeProven;

  const runtimeToPreviewSession = workspaceToRuntime && isSessionObserved(input.session);
  const previewSessionToUrl = runtimeToPreviewSession && input.url.previewUrl !== null;
  const renderToInteraction = reachableToRender && isPreviewInteractive(input.interaction);

  return {
    readOnly: true,
    previewLinkageConnected,
    firstBrokenPreviewLink,
    missingLinks,
    traceabilityScore,
    contractToWorkspace,
    workspaceToRuntime,
    runtimeToPreviewSession,
    previewSessionToUrl,
    urlToRender: reachableToRender,
    renderToInteraction,
  };
}
