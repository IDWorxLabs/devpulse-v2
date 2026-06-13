/**
 * Preview Linkage Analyzer — verify full build-to-preview experience chain.
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
import { isSessionObserved } from './preview-session-analyzer.js';
import { isPreviewUrlReachable } from './preview-url-analyzer.js';

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
    input.session.workspaceLinked;

  const contractToWorkspace = runtimeProven && workspaceExists;
  const workspaceToRuntime =
    contractToWorkspace && input.session.runtimeLinked && runtimeProven;
  const runtimeToPreviewSession =
    workspaceToRuntime && isSessionObserved(input.session);
  const previewSessionToUrl =
    runtimeToPreviewSession && isPreviewUrlReachable(input.url);
  const urlToRender = previewSessionToUrl && isApplicationRendered(input.render);
  const renderToInteraction = urlToRender && isPreviewInteractive(input.interaction);

  const links = [
    { key: 'contract→workspace', ok: contractToWorkspace },
    { key: 'workspace→runtime', ok: workspaceToRuntime },
    { key: 'runtime→previewSession', ok: runtimeToPreviewSession },
    { key: 'previewSession→url', ok: previewSessionToUrl },
    { key: 'url→render', ok: urlToRender },
    { key: 'render→interaction', ok: renderToInteraction },
  ];

  const missingLinks: string[] = [];
  let firstBrokenPreviewLink: string | null = null;
  for (const link of links) {
    if (!link.ok) {
      missingLinks.push(`Broken link: ${link.key}`);
      if (firstBrokenPreviewLink === null) firstBrokenPreviewLink = link.key;
    }
  }

  if (!runtimeProven) {
    missingLinks.unshift('Runtime activation not PROVEN — preview chain cannot start');
    if (firstBrokenPreviewLink === null) firstBrokenPreviewLink = 'contract→workspace';
  }

  const passed = links.filter((l) => l.ok).length;
  const traceabilityScore = Math.round((passed / links.length) * 100);
  const previewLinkageConnected = links.every((l) => l.ok) && runtimeProven;

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
    urlToRender,
    renderToInteraction,
  };
}
