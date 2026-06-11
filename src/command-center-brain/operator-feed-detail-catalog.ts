/**
 * Operator Feed detail catalog — concise process summaries for founder-visible feed cards.
 * No private chain-of-thought. Informational only.
 */

import type { OperatorFeedEvent, OperatorFeedEventType } from './brain-types.js';
import { mapFeedEventToSection } from './runtime-verification/brain-feed-verification.js';

export type OperatorFeedStatus = 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';

export interface OperatorFeedEventDetail {
  section: string;
  action: string;
  detail: string;
  status: OperatorFeedStatus;
  evidence?: string;
}

export const FEED_SECTION_IDLE_COPY: Record<string, { action: string; detail: string }> = {
  Planning: {
    action: 'Ready to classify your next request',
    detail: 'AiDevEngine will identify whether you want to build, verify, preview, or inspect a project.',
  },
  Execution: {
    action: 'Execution runtime not connected yet',
    detail: 'Planning and guidance are available. Connected autonomous execution is not active.',
  },
  Verification: {
    action: 'Ready to evaluate product readiness',
    detail: 'Verification checks product alignment, quality signals, and launch confidence when requested.',
  },
  Approvals: {
    action: 'Waiting for founder decisions when needed',
    detail: 'Approval gates appear only when a decision or review is required.',
  },
  Learning: {
    action: 'Ready to record useful patterns',
    detail: 'Useful outcomes from tests and reviews can inform future recommendations.',
  },
};

const EVENT_DETAILS: Partial<Record<OperatorFeedEventType, Omit<OperatorFeedEventDetail, 'section'>>> = {
  'Classifying Request': {
    action: 'Classifying project request',
    detail:
      'Checking whether this prompt is asking to build, verify, preview, or inspect a project.',
    status: 'Active',
  },
  'Loading Memory': {
    action: 'Reading Project Memory',
    detail: 'Loading stored requirements, facts, and project context for this request.',
    status: 'Active',
    evidence: 'Project Memory',
  },
  'Searching Memory': {
    action: 'Checking Project Memory',
    detail: 'Searching stored context for relevant requirements, decisions, and history.',
    status: 'Active',
    evidence: 'Project Memory',
  },
  'Memory Context Ready': {
    action: 'Project context ready',
    detail: 'Relevant Project Memory context is available for this response.',
    status: 'Completed',
  },
  'Understanding Project': {
    action: 'Understanding project scope',
    detail: 'Reviewing project goals, status, and what the user is trying to accomplish.',
    status: 'Active',
  },
  'Gathering Facts': {
    action: 'Gathering project facts',
    detail: 'Collecting known requirements, architecture notes, and project history.',
    status: 'Active',
  },
  'Evaluating Risks': {
    action: 'Evaluating product risks',
    detail: 'Checking for blockers, gaps, and risks that affect delivery confidence.',
    status: 'Active',
  },
  'Analyzing Dependencies': {
    action: 'Analyzing dependencies',
    detail: 'Reviewing what this project depends on before recommending next steps.',
    status: 'Active',
  },
  'Generating Conclusions': {
    action: 'Summarizing project understanding',
    detail: 'Turning gathered facts into a concise project conclusion.',
    status: 'Active',
  },
  'Loading Project Context': {
    action: 'Loading project context',
    detail: 'Reading active project metadata and workspace context.',
    status: 'Active',
  },
  'Analyzing Project Status': {
    action: 'Analyzing project status',
    detail: 'Checking progress, health signals, and current project state.',
    status: 'Active',
  },
  'Checking Project Gaps': {
    action: 'Checking project gaps',
    detail: 'Identifying missing requirements, planning gaps, or unfinished work.',
    status: 'Active',
  },
  'Checking Project Risks': {
    action: 'Checking project risks',
    detail: 'Reviewing risks that may block progress or launch readiness.',
    status: 'Active',
  },
  'Project Recommendation Ready': {
    action: 'Project recommendation ready',
    detail: 'A project-specific recommendation is prepared for the response.',
    status: 'Completed',
  },
  'Checking Systems': {
    action: 'Checking connected capabilities',
    detail: 'Reviewing which product capabilities apply to this request.',
    status: 'Active',
  },
  'Loading Relationships': {
    action: 'Mapping system relationships',
    detail: 'Checking how product areas relate for this question.',
    status: 'Active',
  },
  'Checking Roadmap': {
    action: 'Checking roadmap context',
    detail: 'Reviewing planning context relevant to the request.',
    status: 'Active',
  },
  'Checking Dependencies': {
    action: 'Checking dependencies',
    detail: 'Reviewing dependency context before answering.',
    status: 'Active',
  },
  'Performing Impact Analysis': {
    action: 'Analyzing impact',
    detail: 'Evaluating what would be affected if related systems changed.',
    status: 'Active',
  },
  'Generating Response': {
    action: 'Generating response',
    detail: 'Composing a product-aligned answer with a clear next action.',
    status: 'Active',
  },
  'Response Ready': {
    action: 'Next action prepared',
    detail: 'Response is ready with product guidance and a recommended next step.',
    status: 'Completed',
  },
  'Understanding Question': {
    action: 'Understanding your question',
    detail: 'Parsing what you are asking and what product outcome you need.',
    status: 'Active',
  },
  'Detecting Context Needs': {
    action: 'Checking context needs',
    detail: 'Determining whether Project Memory, insights, or verification context is required.',
    status: 'Active',
  },
  'Selecting Reasoning Mode': {
    action: 'Selecting response strategy',
    detail: 'Choosing the best product guidance path for this question.',
    status: 'Active',
  },
  'Selecting Capabilities': {
    action: 'Routing to product capabilities',
    detail: 'Matching the request to planning, preview, verification, or project analysis.',
    status: 'Active',
  },
  'Gathering Relevant Facts': {
    action: 'Gathering relevant facts',
    detail: 'Collecting product facts needed for a useful answer.',
    status: 'Active',
  },
  'Composing Answer': {
    action: 'Composing product-aligned answer',
    detail: 'Evaluating response for AiDevEngine product alignment before delivery.',
    status: 'Active',
  },
  'Loading Timeline Context': {
    action: 'Loading timeline context',
    detail: 'Reviewing milestones and progress signals for this project.',
    status: 'Active',
  },
  'Analyzing Timeline': {
    action: 'Analyzing timeline',
    detail: 'Checking schedule, milestones, and delivery sequence.',
    status: 'Active',
  },
  'Checking Milestones': {
    action: 'Checking milestones',
    detail: 'Reviewing completed and upcoming project milestones.',
    status: 'Active',
  },
  'Checking Blockers': {
    action: 'Checking blockers',
    detail: 'Identifying blocked work that may affect recommendations.',
    status: 'Active',
  },
  'Generating Timeline Conclusions': {
    action: 'Summarizing timeline',
    detail: 'Preparing timeline-based guidance for the response.',
    status: 'Active',
  },
  'Loading Decision Context': {
    action: 'Loading decision context',
    detail: 'Reviewing options and priorities for a recommended next move.',
    status: 'Active',
  },
  'Evaluating Options': {
    action: 'Evaluating options',
    detail: 'Comparing practical next actions for the project.',
    status: 'Active',
  },
  'Checking Risks': {
    action: 'Checking risks',
    detail: 'Reviewing risk signals before recommending action.',
    status: 'Active',
  },
  'Ranking Priorities': {
    action: 'Ranking priorities',
    detail: 'Ordering next actions by product impact and readiness.',
    status: 'Active',
  },
  'Generating Recommendation': {
    action: 'Generating recommendation',
    detail: 'Preparing the highest-value next action for the founder.',
    status: 'Active',
  },
};

export const PRODUCT_IDENTITY_OPERATOR_FEED: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Detecting Context Needs',
  'Selecting Reasoning Mode',
  'Composing Answer',
  'Generating Response',
  'Response Ready',
] as const;

const PRODUCT_IDENTITY_OVERRIDES: Partial<
  Record<OperatorFeedEventType, Partial<Pick<OperatorFeedEventDetail, 'action' | 'detail'>>>
> = {
  'Classifying Request': {
    action: 'Request received',
    detail: 'AiDevEngine received your message and started product routing.',
  },
  'Detecting Context Needs': {
    action: 'Intent classified',
    detail: 'Checking whether this is a product identity, build, preview, or verification question.',
  },
  'Selecting Reasoning Mode': {
    action: 'Response strategy selected',
    detail: 'Routing to product identity response for AiDevEngine guidance.',
  },
  'Composing Answer': {
    action: 'Product alignment checked',
    detail: 'Evaluating response for AiDevEngine product alignment and architecture leakage.',
  },
  'Generating Response': {
    action: 'Response generated',
    detail: 'Composing a product-first answer with clear next steps.',
  },
};

export function resolveOperatorFeedEventDetail(
  eventType: OperatorFeedEventType,
  options?: { productIdentity?: boolean },
): OperatorFeedEventDetail {
  const base = EVENT_DETAILS[eventType];
  const override = options?.productIdentity ? PRODUCT_IDENTITY_OVERRIDES[eventType] : undefined;
  const section = mapFeedEventToSection(eventType);
  return {
    section,
    action: override?.action ?? base?.action ?? eventType,
    detail: override?.detail ?? base?.detail ?? 'Processing this step for your request.',
    status: base?.status ?? 'Active',
    evidence: base?.evidence,
  };
}

export function enrichOperatorFeedEvents(
  sequence: readonly OperatorFeedEventType[],
  timestamp: number,
  options?: { productIdentity?: boolean },
): OperatorFeedEvent[] {
  const total = sequence.length;
  return sequence.map((eventType, index) => {
    const detail = resolveOperatorFeedEventDetail(eventType, options);
    return {
      eventId: `feed-${(index + 1).toString().padStart(2, '0')}`,
      eventType,
      timestamp: timestamp + index,
      informationalOnly: true as const,
      section: detail.section,
      action: detail.action,
      detail: detail.detail,
      status: detail.status,
      stepIndex: index + 1,
      stepTotal: total,
      evidence: detail.evidence,
    };
  });
}

export const FORBIDDEN_VAGUE_FEED_PHRASES = [
  'Waiting for pipeline',
  'Processing',
  'Thinking',
  'Running system',
] as const;
