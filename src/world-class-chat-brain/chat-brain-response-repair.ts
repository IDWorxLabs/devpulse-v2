/**
 * Phase 25.38 — Response repair — direct, honest, human, evidence-grounded.
 */

import { generateChatCognitiveResponse } from '../chat-cognitive-architecture/index.js';
import { buildChatSelfModel } from '../chat-cognitive-architecture/chat-self-model.js';
import { summarizeCapabilityHonesty, buildChatBrainCapabilityModel } from './chat-brain-capability-model.js';
import { stripGenericOnboardingFromAnswer } from './chat-brain-answer-judge.js';
import type {
  ChatBrainContext,
  ChatBrainIntent,
  ChatBrainJudgement,
  ChatBrainReasoningMode,
} from './chat-brain-types.js';

function founderOpener(intent: ChatBrainIntent['category']): string {
  switch (intent) {
    case 'HUMAN_QUALITY':
      return "Here's the honest take — I'll talk to you like a founder, not a onboarding script.";
    case 'SELF':
      return "Straight answer:";
    case 'PROJECT_REALITY':
      return "Here's what DevPulse can actually see right now:";
    case 'LAUNCH':
      return "Launch honesty first — no cheerleading without evidence:";
    default:
      return '';
  }
}

function humanizeProse(text: string, mode: ChatBrainReasoningMode): string {
  let result = stripGenericOnboardingFromAnswer(text);
  result = result.replace(/\n{3,}/g, '\n\n');

  if (mode === 'FOUNDER_CONVERSATIONAL') {
    result = result.replace(/^•\s+/gm, '- ');
    if (!/\b(you|we|I'll|here's)\b/i.test(result.slice(0, 80))) {
      result = result.replace(/^([A-Z])/, "I'll be direct: $1");
    }
  }
  return result.trim();
}

function composeHumanQualityResponse(context: ChatBrainContext): string {
  return [
    "Fair question — I'm meant to talk like a founder-facing partner, not a scripted bot.",
    '',
    "I reason from what DevPulse can prove: Founder Test, verification, execution proof, and launch readiness signals. When evidence is missing, I say so instead of sounding confident.",
    '',
    `Right now I can see: ${context.founderTestStatus}.`,
    context.knownBlockers.length
      ? `Top blocker: ${context.knownBlockers[0]}.`
      : 'Run Founder Test if you want a fresh grounded picture.',
    '',
    "Ask me something specific — your product idea, what's broken, or what to do next — and I'll keep it direct and human.",
  ].join('\n');
}

function composeSelfCompletenessResponse(context: ChatBrainContext): string {
  const self = buildChatSelfModel();
  return [
    "What I'm missing to be 'complete' as a software-creation partner:",
    '',
    ...self.systemsIncomplete.map((item) => `- ${item}`),
    '',
    "I'm not missing human consciousness — that's not the goal. I'm missing reliable always-on proof that every launch claim is backed by connected execution and founder acceptance.",
    '',
    context.evidenceGaps.length
      ? `Session gaps: ${context.evidenceGaps.slice(0, 2).join('; ')}.`
      : '',
    '',
    'Next: run Founder Test and close the top blocker it reports.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function repairChatBrainResponse(input: {
  message: string;
  draft: string;
  intent: ChatBrainIntent;
  context: ChatBrainContext;
  judgement: ChatBrainJudgement;
}): string {
  const { message, draft, intent, context, judgement } = input;
  const self = buildChatSelfModel();
  const capability = buildChatBrainCapabilityModel(context);
  const mode = intent.reasoningMode;

  if (intent.category === 'HUMAN_QUALITY') {
    return humanizeProse(composeHumanQualityResponse(context), 'FOUNDER_CONVERSATIONAL');
  }

  if (/missing to be complete|what are you missing/i.test(message)) {
    return humanizeProse(composeSelfCompletenessResponse(context), mode);
  }

  const cognitive = generateChatCognitiveResponse({
    message,
    draftResponse: stripGenericOnboardingFromAnswer(draft),
    rootDir: process.cwd(),
  });

  let repaired = cognitive.finalAnswer.trim();
  if (!repaired || judgement.genericOnboardingViolation) {
    const opener = founderOpener(intent.category);
    const lines: string[] = [];
    if (opener) lines.push(opener, '');

    switch (intent.category) {
      case 'SELF':
        if (/who created|who built|where did you come/i.test(message)) {
          lines.push(self.creatorOrigin);
        } else if (/self aware|conscious/i.test(message)) {
          lines.push(
            "No — I'm not self-aware like a human. I don't have consciousness or feelings.",
            self.boundedSelfAwareness,
          );
        } else if (/what are you/i.test(message)) {
          lines.push(self.whatItIs);
        } else {
          lines.push(self.whatItIs, self.boundedSelfAwareness);
        }
        break;
      case 'CAPABILITY':
        lines.push('What I can honestly do today:', ...self.canHelpWithToday.map((c) => `- ${c}`));
        lines.push('', 'What I cannot claim yet:', ...self.cannotClaimYet.map((c) => `- ${c}`));
        lines.push('', summarizeCapabilityHonesty(capability));
        break;
      case 'PROJECT_REALITY':
        lines.push(context.projectStatus);
        if (context.knownBlockers.length) {
          lines.push('', 'Known blockers:', ...context.knownBlockers.map((b) => `- ${b}`));
        }
        break;
      case 'LAUNCH':
        lines.push(context.launchReadinessStatus);
        lines.push(self.boundedLaunchReadiness);
        if (context.knownBlockers.length) {
          lines.push('', 'What blocks launch:', ...context.knownBlockers.slice(0, 3).map((b) => `- ${b}`));
        }
        break;
      case 'SOFTWARE_CREATION':
        lines.push(
          "I'll help you think this through before any build claims — users, workflow, data, and verification matter more than a quick yes.",
        );
        break;
      default:
        lines.push(self.whatItIs);
    }

    const next =
      context.knownBlockers[0]
        ? `\n\nNext step: address "${context.knownBlockers[0]}".`
        : '\n\nNext step: run Founder Test for a fresh bounded readiness picture.';
    repaired = lines.join('\n') + next;
  }

  return humanizeProse(repaired, mode);
}
