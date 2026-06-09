/**
 * Decision option model — structured advisory options from context.
 */

import type { DecisionCategory, DecisionContext, DecisionOption } from './decision-types.js';
import type { RiskLevel } from '../foundation/types.js';

let optionCounter = 0;

function nextDecisionId(): string {
  optionCounter += 1;
  return `decision-${optionCounter.toString().padStart(4, '0')}`;
}

export function resetDecisionOptionCounterForTests(): void {
  optionCounter = 0;
}

function option(
  title: string,
  description: string,
  category: DecisionCategory,
  priority: number,
  riskLevel: RiskLevel,
  recommendedAction: string,
  blocked: boolean,
  blockers: string[],
  supportingFacts: string[],
  relatedSystems: string[],
  timelineDependency: string,
): DecisionOption {
  const confidence =
    blockers.length === 0 && supportingFacts.length >= 2
      ? 'HIGH'
      : supportingFacts.length >= 1
        ? 'MEDIUM'
        : 'LOW';

  return {
    decisionId: nextDecisionId(),
    title,
    description,
    category,
    priority,
    riskLevel,
    confidence,
    recommendedAction,
    blocked,
    blockers,
    supportingFacts,
    relatedSystems,
    timelineDependency,
  };
}

export function createDecisionOptions(context: DecisionContext): DecisionOption[] {
  const options: DecisionOption[] = [];
  const foundationFacts = context.supportingFacts.slice(0, 4);
  const executionBlocked = context.blockedItems.some((b) => b.toLowerCase().includes('execution'));
  const cloudBlocked = context.blockedItems.some((b) => b.toLowerCase().includes('cloud'));

  options.push(
    option(
      'Unified Decision Layer Foundation',
      'Complete and validate the Unified Decision Layer — structured advisory intelligence for build/defer/block decisions.',
      'BUILD_NEXT',
      95,
      'low',
      'Finish Phase 11.6 validation, then advance to Development Reasoning Foundation.',
      false,
      [],
      [
        ...foundationFacts,
        `Current phase: ${context.currentPhase}`,
        'Decision layer provides advisory recommendations only — no execution.',
      ],
      ['Command Center Brain', 'General Question Understanding'],
      'Follows Timeline Intelligence (11.5); precedes Development Reasoning.',
    ),
    option(
      'Development Reasoning Foundation',
      'Structured development reasoning for code and implementation questions — not yet implemented.',
      'DEFER',
      88,
      'medium',
      'Defer until Unified Decision Layer is validated; then build Development Reasoning Foundation.',
      true,
      ['Development Reasoning not implemented', 'Unified Decision Layer must complete first'],
      ['Development reasoning is listed as unavailable in the General Question Router.'],
      ['Command Center Brain'],
      'Depends on Unified Decision Layer and Project Knowledge Reasoning.',
    ),
    option(
      'Debugging Reasoning Foundation',
      'Structured debugging reasoning for error and failure questions — not yet implemented.',
      'DEFER',
      82,
      'medium',
      'Defer debugging reasoning until development reasoning foundation exists.',
      true,
      ['Debugging Reasoning not implemented'],
      context.missingCapabilities.length > 0
        ? [`${context.missingCapabilities.length} capabilities still missing from full runtime maturity.`]
        : ['Debugging reasoning unavailable in current router.'],
      ['Command Center Brain'],
      'Follows Development Reasoning in roadmap sequence.',
    ),
    option(
      'Execution Runtime Connection',
      'Connect governed execution runtime to Command Center — high risk if introduced prematurely.',
      'DO_NOT_BUILD_YET',
      20,
      'high',
      'Do not build execution now. Complete decision, development, debugging, and verification layers first.',
      true,
      [
        'Development Reasoning not implemented',
        'Debugging Reasoning not implemented',
        'Execution Reasoning not implemented',
        ...(executionBlocked ? context.blockedItems.filter((b) => b.toLowerCase().includes('execution')) : []),
      ],
      [
        'Execution depends on stronger decision, development reasoning, verification, and controlled authorization layers.',
        ...context.riskFacts.filter((r) => r.toLowerCase().includes('execution') || r.toLowerCase().includes('governance')).slice(0, 2),
      ],
      ['Execution Authority', 'Governance Stack', 'Founder Approval Gate'],
      'Requires Phase 6 governance stack maturity and intelligence layer completion.',
    ),
    option(
      'Cloud Runtime',
      'Remote cloud workspace runtime — deferred until local intelligence and execution foundations are stable.',
      'DO_NOT_BUILD_YET',
      15,
      'high',
      'Defer cloud runtime. Focus on local foundation intelligence and governed execution readiness.',
      true,
      [
        'Cloud runtime must wait until local runtime understanding is stable.',
        ...(cloudBlocked ? context.blockedItems.filter((b) => b.toLowerCase().includes('cloud')) : []),
      ],
      context.riskFacts.slice(0, 2),
      ['Mobile Command Foundation', 'Cross-Device Continuity'],
      'Follows local runtime maturity and execution governance.',
    ),
    option(
      'Autonomous Building / World 2 Execution',
      'Autonomous builder and World 2 execution — highest premature-build risk.',
      'RISK_WARNING',
      10,
      'critical',
      'Do not pursue autonomous building now. Intelligence and governance foundations are still advancing.',
      true,
      [
        'World 2 execution not connected',
        'Execution runtime not connected',
        'Autonomous building requires completed intelligence and verification stack',
      ],
      context.riskFacts,
      ['World 2 Autonomous Builder', 'Controlled Execution Bridge'],
      'Requires World 2 foundation stack plus governed execution bridge.',
    ),
    option(
      'Phase 11.6 Validation',
      'Run unified decision layer validation and typecheck before advancing roadmap.',
      'VALIDATE_FIRST',
      90,
      'low',
      'Validate decision context, ranking, blockers, and router integration with 350+ scenarios.',
      false,
      [],
      ['Validation confirms intelligence-only behavior with no execution paths.'],
      ['Validation Budget Policy', 'Founder Reality Surface'],
      'Immediate step within current phase.',
    ),
    option(
      'Founder Approval of Next Foundation Step',
      'Founder reviews and approves advancing from Decision Layer to Development Reasoning.',
      'SAFE_FOUNDATION',
      85,
      'low',
      'Approve completing Unified Decision Layer validation, then authorize Development Reasoning Foundation planning.',
      false,
      [],
      [
        `Roadmap next phase: ${context.nextPhase}`,
        context.roadmapNextStep,
      ],
      ['Founder Approval Execution Gate', 'Trust Engine'],
      'Governance checkpoint before next intelligence layer.',
    ),
    option(
      'Persistent Project Storage',
      'Database-backed project vault persistence — deferred until understanding layers are stable.',
      'DEFER',
      40,
      'medium',
      'Defer persistent storage until Project Understanding and Decision Layer are validated.',
      true,
      ['Project Vault UI must wait until Project Understanding foundation exists.'],
      ['Persistent project storage is in missing capabilities list.'],
      ['Project Vault', 'Project Understanding Engine'],
      'Follows project understanding maturity.',
    ),
    option(
      'Code Generation Runtime',
      'Live code generation and file writes — explicitly blocked in foundation phases.',
      'BLOCKED',
      5,
      'critical',
      'Do not build code generation now. Planning stack exists; execution and generation remain disconnected.',
      true,
      ['Code generation is not connected', 'File modification requests are blocked'],
      context.missingCapabilities.filter((c) => c.toLowerCase().includes('code')).map((c) => `${c} is not yet connected.`),
      ['AiDev Engine', 'Code Generation Planner'],
      'Requires full planning-to-execution governance chain.',
    ),
  );

  for (const cap of context.missingCapabilities.slice(0, 4)) {
    if (options.some((o) => o.title.toLowerCase().includes(cap.toLowerCase()))) continue;
    options.push(
      option(
        cap,
        `${cap} is registered as a missing capability — defer until prerequisite foundations complete.`,
        'DEFER',
        35,
        'medium',
        `Defer ${cap} until roadmap prerequisites and governance gates are satisfied.`,
        true,
        [`${cap} not implemented or not connected`],
        [`${cap} appears in project missing capabilities.`],
        context.relatedSystems.slice(0, 2),
        'Subject to roadmap sequence and blocker analysis.',
      ),
    );
  }

  return options;
}
