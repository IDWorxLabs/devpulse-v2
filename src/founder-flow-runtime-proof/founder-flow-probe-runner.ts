/**
 * Founder flow probe runner — UI interactive scan and flow-start signals (Phase 26.86).
 */

import type {
  FounderFlowInteractiveScan,
  FounderFlowProbeResult,
} from './founder-flow-runtime-proof-types.js';
import type { RuntimeUiRenderProofReport } from '../runtime-ui-render-proof/runtime-ui-render-proof-types.js';

const INTERACTIVE_PATTERNS = {
  button: /<button\b/i,
  input: /<input\b/i,
  link: /<a\b[^>]*href\s*=/i,
  form: /<form\b/i,
  onClick: /\bon(click|submit)\s*=/i,
  roleButton: /role\s*=\s*["']button["']/i,
};

export function scanInteractiveElements(html: string | null | undefined): FounderFlowInteractiveScan {
  const body = html ?? '';
  const hasButton = INTERACTIVE_PATTERNS.button.test(body) || INTERACTIVE_PATTERNS.roleButton.test(body);
  const hasInput = INTERACTIVE_PATTERNS.input.test(body);
  const hasLink = INTERACTIVE_PATTERNS.link.test(body);
  const hasForm = INTERACTIVE_PATTERNS.form.test(body);
  const hasOnClickHandler = INTERACTIVE_PATTERNS.onClick.test(body);

  let interactiveElementCount = 0;
  if (hasButton) interactiveElementCount += 1;
  if (hasInput) interactiveElementCount += 1;
  if (hasLink) interactiveElementCount += 1;
  if (hasForm) interactiveElementCount += 1;
  if (hasOnClickHandler) interactiveElementCount += 1;

  return {
    readOnly: true,
    interactiveElementCount,
    hasButton,
    hasInput,
    hasLink,
    hasForm,
    hasOnClickHandler,
    scanSource: 'html-body-excerpt',
  };
}

export function runFounderFlowProbe(input: {
  uiRenderProof: RuntimeUiRenderProofReport | null;
  uiRendersBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  applicationBootsBeforeProbe: boolean;
  skipProbe?: boolean;
}): FounderFlowProbeResult {
  if (!input.uiRendersBeforeProbe) {
    return {
      readOnly: true,
      founderRuntimeOpen: false,
      uiLoadedAsApp: false,
      flowStartProven: false,
      interactiveScan: {
        readOnly: true,
        interactiveElementCount: 0,
        hasButton: false,
        hasInput: false,
        hasLink: false,
        hasForm: false,
        hasOnClickHandler: false,
        scanSource: 'none',
      },
      probeSkipped: true,
      skipReason: 'UI_RENDER_NOT_READY: founder flow probe requires uiRenders=true',
    };
  }

  if (input.skipProbe) {
    return {
      readOnly: true,
      founderRuntimeOpen: input.routesReachableBeforeProbe && input.applicationBootsBeforeProbe,
      uiLoadedAsApp: input.uiRendersBeforeProbe,
      flowStartProven: false,
      interactiveScan: scanInteractiveElements(null),
      probeSkipped: true,
      skipReason: 'PROBE_SKIPPED_BY_CALLER',
    };
  }

  const rootProbe =
    input.uiRenderProof?.probeSession.probeResults.find((p) => p.path === '/') ??
    input.uiRenderProof?.probeSession.probeResults[0] ??
    null;
  const html = rootProbe?.isHtml ? rootProbe.bodyExcerpt : null;
  const interactiveScan = scanInteractiveElements(html);

  const founderRuntimeOpen =
    input.applicationBootsBeforeProbe && input.routesReachableBeforeProbe && input.uiRendersBeforeProbe;
  const uiLoadedAsApp = input.uiRendersBeforeProbe && (rootProbe?.isHtml === true || rootProbe?.hasRootMount === true);
  const flowStartProven =
    uiLoadedAsApp &&
    (interactiveScan.interactiveElementCount > 0 || (rootProbe?.hasRootMount === true && rootProbe?.hasScriptBundle === true));

  return {
    readOnly: true,
    founderRuntimeOpen,
    uiLoadedAsApp,
    flowStartProven,
    interactiveScan,
    probeSkipped: false,
    skipReason: null,
  };
}
