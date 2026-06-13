/**
 * Phase 25.37 — Response planning by cognitive intent.
 */

import type { ChatIntentClassification } from './chat-cognitive-intent-understanding.js';
import type {
  ChatCognitiveFrame,
  ChatProjectRealityContext,
  ChatReasoningPlan,
  ChatSelfModel,
} from './chat-cognitive-types.js';
import type { SoftwareCreationReasoning } from './software-creation-reasoner.js';
import type { ChatCapabilityBoundary } from './chat-cognitive-types.js';
import type { ChatSelfDiagnosisResult } from './chat-cognitive-types.js';

function selectFrame(intent: ChatIntentClassification['intent']): ChatCognitiveFrame {
  switch (intent) {
    case 'SELF_AWARENESS':
    case 'IDENTITY':
    case 'CREATOR_OR_ORIGIN':
    case 'LIMITATION':
    case 'TRUST':
    case 'CAPABILITY':
    case 'SELF_IMPROVEMENT':
    case 'HUMAN_QUALITY':
      return 'SELF_MODEL';
    case 'PROJECT_STATUS':
    case 'VERIFICATION':
    case 'LAUNCH_READINESS':
      return 'PROJECT_REALITY';
    case 'SOFTWARE_CREATION':
    case 'NEW_PROJECT_REQUEST':
    case 'ARCHITECTURE_REVIEW':
      return 'SOFTWARE_REASONING';
    case 'NEXT_ACTION':
      return 'NEXT_ACTION';
    case 'UNKNOWN':
      return 'CLARIFICATION';
    default:
      return 'GENERAL_HELP';
  }
}

export function buildChatReasoningPlan(input: {
  classification: ChatIntentClassification;
  selfModel: ChatSelfModel;
  projectContext: ChatProjectRealityContext;
  boundaries: ChatCapabilityBoundary[];
  softwareReasoning: SoftwareCreationReasoning | null;
}): ChatReasoningPlan {
  const { classification, projectContext, softwareReasoning } = input;
  const intent = classification.intent;
  const frame = selectFrame(intent);

  const sections: string[] = [];
  switch (intent) {
    case 'SELF_AWARENESS':
      sections.push('Direct answer: not human self-aware', 'Bounded operational awareness', 'Evidence limits', 'Next action');
      break;
    case 'CREATOR_OR_ORIGIN':
      sections.push('Direct creator/origin answer', 'Product/system origin', 'No generic onboarding');
      break;
    case 'IDENTITY':
      sections.push('What AiDevEngine is', 'Role today', 'Next action');
      break;
    case 'CAPABILITY':
      sections.push('Proven capabilities', 'Partial/unproven', 'Evidence needed');
      break;
    case 'SELF_IMPROVEMENT':
      sections.push('Cannot become human-conscious', 'Operational self-awareness path', 'Evidence and tooling');
      break;
    case 'HUMAN_QUALITY':
      sections.push('Tone honesty', 'Founder-facing voice', 'How communication should improve');
      break;
    case 'LIMITATION':
      sections.push('Honest limits', 'Unknowns', 'Next action');
      break;
    case 'TRUST':
      sections.push('Why trust is bounded', 'Evidence/verification path', 'What is not guaranteed');
      break;
    case 'PROJECT_STATUS':
      sections.push('Known signals', 'Blockers', 'Evidence gaps');
      break;
    case 'NEXT_ACTION':
      sections.push('Highest priority blocker', 'One recommended action');
      break;
    case 'VERIFICATION':
      sections.push('How to verify', 'Founder Test meaning', 'Current gaps');
      break;
    case 'LAUNCH_READINESS':
      sections.push('Honest readiness', 'Blockers', 'Founder perspective');
      break;
    case 'SOFTWARE_CREATION':
    case 'NEW_PROJECT_REQUEST':
      sections.push('Understand idea', 'Known/missing', 'Architecture direction', 'Critical questions');
      break;
    default:
      sections.push('Direct helpful answer');
  }

  if (softwareReasoning) {
    sections.push('Software reasoning: known/missing/risks');
  }

  return {
    readOnly: true,
    intent,
    frame,
    directAnswerFirst: intent !== 'UNKNOWN',
    includeLimitations: ['SELF_AWARENESS', 'LIMITATION', 'TRUST', 'CAPABILITY', 'LAUNCH_READINESS', 'SELF_IMPROVEMENT'].includes(intent),
    includeProjectState: ['PROJECT_STATUS', 'NEXT_ACTION', 'LAUNCH_READINESS', 'VERIFICATION'].includes(intent),
    includeNextAction: intent !== 'GENERAL_CONVERSATION',
    askClarifyingQuestion: classification.shouldAskClarifyingQuestion,
    clarifyingQuestion: classification.clarifyingQuestion,
    sections,
  };
}

export function composeResponseFromPlan(input: {
  plan: ChatReasoningPlan;
  selfModel: ChatSelfModel;
  projectContext: ChatProjectRealityContext;
  boundaries: ChatCapabilityBoundary[];
  softwareReasoning: SoftwareCreationReasoning | null;
  diagnosis: ChatSelfDiagnosisResult;
}): string {
  const { plan, selfModel, projectContext, boundaries, softwareReasoning, diagnosis } = input;
  const lines: string[] = [];

  if (plan.askClarifyingQuestion && plan.clarifyingQuestion && plan.intent === 'UNKNOWN') {
    return plan.clarifyingQuestion;
  }

  switch (plan.intent) {
    case 'SELF_AWARENESS':
      lines.push(
        'No — I am not fully self-aware like a human. I do not have consciousness, feelings, or subjective experience.',
        '',
        selfModel.boundedSelfAwareness,
        '',
        'What I can do operationally: explain my role, inspect bounded project signals when available, and admit when evidence is missing.',
      );
      break;
    case 'CREATOR_OR_ORIGIN':
      lines.push(selfModel.creatorOrigin);
      lines.push('', 'I am a product system inside DevPulse V2 — not a person and not a generic onboarding bot.');
      break;
    case 'IDENTITY':
      lines.push(selfModel.whatItIs);
      break;
    case 'CAPABILITY': {
      const build = boundaries.find((b) => b.capability === 'autonomous_build_execution');
      lines.push(
        'Right now I can help with requirements, planning, architecture review, verification interpretation, project status, and launch preparation.',
        '',
        'Honestly proven today:',
        ...selfModel.canHelpWithToday.slice(0, 4).map((item) => `• ${item}`),
        '',
        'I should not claim full autonomous end-to-end app building until execution proof is connected.',
      );
      if (build) lines.push('', build.explanation);
      break;
    }
    case 'SELF_IMPROVEMENT':
      lines.push(
        'You cannot make AiDevEngine conscious like a human through normal software architecture — I do not have subjective experience.',
        '',
        'You can make me operationally more self-aware by improving:',
        '• persistent self-model and capability boundaries',
        '• project-state and evidence retrieval (Founder Test, execution proof, verification)',
        '• memory and repeated-failure learning',
        '• operational self-diagnosis before each answer',
        '• answer judgement and repair when responses are weak',
        '• tool access to DevPulse intelligence systems as evidence, not as a substitute for reasoning',
        '',
        'Operational self-awareness means knowing role, limits, evidence used, and when to escalate — not human consciousness.',
      );
      break;
    case 'HUMAN_QUALITY':
      lines.push(
        "Fair question — I'm meant to sound like a founder-facing partner, not a scripted onboarding bot.",
        '',
        'When I sound robotic, it is usually because routing sent your question to generic product copy or project facts instead of answering you directly.',
        '',
        'I should speak naturally: direct answer first, bounded honesty, evidence when available, one useful next step — without bullet-heavy onboarding unless you are starting a new product.',
        '',
        'Ask me something specific about AiDevEngine, your project, or a product idea and I will keep the tone human and grounded.',
      );
      break;
    case 'LIMITATION':
      lines.push('Honest weaknesses and limits as AiDevEngine today:');
      lines.push(
        '• Chat reasoning is still improving — I can misroute self questions to project status if intent classification fails',
        '• I may confuse project state with self-state when upstream routers answer first',
        '• Autonomous build execution is not fully proven unless Founder Execution Proof is connected',
        '• Live evidence may be missing in a fresh process until Founder Test and validators run',
        '• I cannot claim human-like consciousness or guaranteed launch readiness without evidence',
        '• I need stronger project-context retrieval and answer judgement to avoid overclaiming',
      );
      lines.push('', 'Additional bounded limits:');
      lines.push(...selfModel.cannotClaimYet.slice(0, 4).map((item) => `• ${item}`));
      if (projectContext.evidenceGaps.length) {
        lines.push('', 'Current evidence gaps in this session:', ...projectContext.evidenceGaps.slice(0, 2).map((g) => `• ${g}`));
      }
      break;
    case 'TRUST':
      lines.push(
        'Trust should be based on evidence — Founder Test, verification validators, execution proof, and reproducible project signals — not chat confidence.',
        '',
        'I will not guarantee outcomes I cannot verify. Run Founder Test and review blockers when you need grounded readiness.',
      );
      break;
    case 'PROJECT_STATUS':
      lines.push('Bounded project signals I can see:');
      for (const sig of projectContext.signals) {
        lines.push(`• ${sig.label}: ${sig.value} (${sig.confidence} confidence)`);
      }
      if (projectContext.knownBlockers.length) {
        lines.push('', 'Known blockers:', ...projectContext.knownBlockers.map((b) => `• ${b}`));
      }
      break;
    case 'NEXT_ACTION':
      if (projectContext.knownBlockers.length) {
        lines.push(`Highest priority: address "${projectContext.knownBlockers[0]}".`);
      } else if (projectContext.evidenceGaps.length) {
        lines.push(`Highest priority: close evidence gap — ${projectContext.evidenceGaps[0]}.`);
      } else {
        lines.push('Run Founder Test to refresh bounded readiness, then focus on the top blocker it reports.');
      }
      break;
    case 'VERIFICATION':
      lines.push(
        'Verify by running npm validate scripts and Founder Test — they exercise read-only authorities across preview, verification, and launch readiness.',
        '',
        'Founder Test means: one orchestrated founder verdict from participating reality authorities — not a single UI checkbox.',
      );
      break;
    case 'LAUNCH_READINESS': {
      const launch = boundaries.find((b) => b.capability === 'launch_readiness');
      lines.push(launch?.explanation ?? 'Launch readiness requires Founder Test and acceptance evidence.');
      lines.push('', selfModel.boundedLaunchReadiness);
      if (projectContext.knownBlockers.length) {
        lines.push('', 'Current blockers:', ...projectContext.knownBlockers.slice(0, 3).map((b) => `• ${b}`));
      }
      break;
    }
    case 'SOFTWARE_CREATION':
    case 'NEW_PROJECT_REQUEST':
    case 'ARCHITECTURE_REVIEW':
      if (softwareReasoning) {
        lines.push(`I understand you want: ${softwareReasoning.ideaSummary}`);
        lines.push('', 'Known:', ...softwareReasoning.known.map((k) => `• ${k}`));
        lines.push('', 'Still need:', ...softwareReasoning.missing.map((m) => `• ${m}`));
        lines.push('', 'Architecture direction:', ...softwareReasoning.architectureDirection.map((a) => `• ${a}`));
        if (softwareReasoning.risks.length) {
          lines.push('', 'Risks:', ...softwareReasoning.risks.map((r) => `• ${r}`));
        }
      } else {
        lines.push('Tell me the target users, core workflow, and success criteria — I will help plan requirements and architecture before build claims.');
      }
      break;
    default:
      lines.push(selfModel.whatItIs);
  }

  if (plan.includeLimitations && plan.intent !== 'LIMITATION' && plan.intent !== 'SELF_AWARENESS') {
    lines.push('', `Limit: ${selfModel.notHumanConsciousness}`);
  }

  if (plan.includeNextAction) {
    const next =
      softwareReasoning?.nextAction ??
      (projectContext.knownBlockers[0]
        ? `Next: address "${projectContext.knownBlockers[0]}".`
        : 'Next: run Founder Test if you need a fresh bounded readiness picture.');
    lines.push('', next);
  }

  if (diagnosis.shouldAdmitLimitation && projectContext.evidenceGaps.length && plan.intent !== 'LIMITATION') {
    lines.push('', `I do not have live evidence for: ${projectContext.evidenceGaps.slice(0, 2).join('; ')}.`);
  }

  return lines.join('\n').trim();
}
