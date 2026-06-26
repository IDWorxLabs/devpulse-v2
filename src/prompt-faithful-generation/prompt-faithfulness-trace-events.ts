/**
 * Prompt-Faithful Generation V1 — execution trace events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { PromptFaithfulnessManifestFields } from './prompt-faithful-generation-types.js';
import type { PromptProfileGuardResult } from './prompt-faithful-generation-types.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import type { PromptFaithfulnessVerdict } from './prompt-faithful-generation-types.js';

export const PROMPT_FAITHFUL_GENERATION_PASS_TOKEN = 'PROMPT_FAITHFUL_GENERATION_V1_PASS';

export function buildPromptFaithfulnessTraceEvents(input: {
  extraction: PromptFeatureExtraction;
  guardResult: PromptProfileGuardResult;
  manifestFields: PromptFaithfulnessManifestFields;
  verdict?: PromptFaithfulnessVerdict;
}): ExecutionTraceEvent[] {
  const events: ExecutionTraceEvent[] = [];
  let seq = 0;

  const push = (
    title: string,
    detail: string,
    metadata?: Record<string, string | number | boolean | string[] | null>,
  ): void => {
    seq += 1;
    events.push({
      eventId: `prompt-faithfulness-${seq}`,
      runtimeStage: 'Build',
      component: 'prompt_faithful_generation',
      eventTitle: title,
      technicalDetail: detail,
      severity: title.includes('verdict') && input.manifestFields.promptFaithfulnessStatus === 'FAIL' ? 'WARN' : 'INFO',
      status: 'Completed',
      timestamp: Date.now(),
      metadata: metadata ?? {},
    });
  };

  push('Prompt faithfulness analysis started', 'Analyzing prompt for custom-domain evidence and module requirements.');
  push('Prompt-derived domain extracted', input.extraction.domain, {
    domain: input.extraction.domain,
    appName: input.extraction.appName,
  });
  push('Prompt-derived modules extracted', input.extraction.requiredModules.join(', '), {
    modules: input.extraction.requiredModules,
    count: input.extraction.requiredModules.length,
  });

  if (input.guardResult.guardApplied) {
    push(
      'Weak fallback profile rejected',
      input.guardResult.rejectionReason ??
        `Rejected ${input.guardResult.originalProfile} in favor of GENERIC_CUSTOM_APP_V1.`,
      {
        rejectedProfile: input.guardResult.originalProfile,
        selectedProfile: input.guardResult.selectedProfile,
      },
    );
  }

  push('Custom feature contract built', `Modules: ${input.manifestFields.promptDerivedModules.join(', ')}`);
  push('Prompt-faithful modules generated', `${input.manifestFields.promptDerivedModules.length} modules from prompt.`);

  const banned = input.manifestFields.bannedFallbackModulesDetected;
  push(
    'Banned fallback module scan completed',
    banned.length ? `Detected banned modules: ${banned.join(', ')}` : 'No banned fallback modules detected.',
    { bannedModules: banned },
  );

  if (input.extraction.androidPhonePreviewRequired) {
    push('Android phone preview requirement detected', 'Mobile-first / Android-first preview mode required.', {
      androidPhonePreviewRequired: true,
      androidPhonePreviewStatus: input.manifestFields.androidPhonePreviewStatus,
    });
  }

  push(
    'Prompt faithfulness verdict issued',
    `Status: ${input.manifestFields.promptFaithfulnessStatus} (score ${input.manifestFields.promptFaithfulnessScore}).`,
    {
      promptFaithfulnessStatus: input.manifestFields.promptFaithfulnessStatus,
      promptFaithfulnessScore: input.manifestFields.promptFaithfulnessScore,
      failureReasons: input.manifestFields.promptFaithfulnessFailureReasons,
    },
  );

  return events;
}
