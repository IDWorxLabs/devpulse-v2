/**
 * World 2 activation request parser.
 */

import type { World2ActivationRequest } from './world2-execution-activation-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `w2req-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetWorld2ActivationRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseWorld2ActivationRequest(query: string): World2ActivationRequest {
  const lower = query.toLowerCase().trim();
  let title = 'World 2 Activation Request';
  let goal = 'Evaluate World 2 execution activation without performing real execution';
  let outcome = 'Activation plan with isolation, governance gates, runtime chain, and readiness — simulation only';

  if (lower.includes('can world 2 execution') || lower.includes('activate world 2')) {
    title = 'Can World 2 Execution Be Activated';
    goal = 'Assess whether World 2 execution pathway can be activated under governance';
    outcome = 'Activation plan with blockers, gates, and approval requirements';
  } else if (lower.includes('is world 2 isolated') || lower.includes('world 2 workspace')) {
    title = 'World 2 Isolation';
    goal = 'Verify World 2 workspace isolation and World 1 protection';
    outcome = 'Workspace isolation report — no World 1 modification';
  } else if (lower.includes('gates are required') || lower.includes('governance')) {
    title = 'World 2 Governance Gates';
    goal = 'Identify governance gates required for World 2 activation';
    outcome = 'Governance gate report with approval requirements';
  } else if (lower.includes('blocks world 2') || lower.includes('what blocks world 2')) {
    title = 'World 2 Activation Blockers';
    goal = 'Identify what prevents World 2 execution activation';
    outcome = 'Blocker list with readiness advisory';
  } else if (lower.includes('runtime chain')) {
    title = 'World 2 Runtime Chain';
    goal = 'Link Phase 14 runtime chain for World 2 activation pathway';
    outcome = 'Runtime chain link across execution, build, generation, testing, auto-fix, verification';
  } else if (lower.includes('can world 2 build')) {
    title = 'Can World 2 Build Now';
    goal = 'Assess whether World 2 can build in a future governed phase';
    outcome = 'Readiness advisory — activation simulation-only';
  } else if (lower.includes('approval is required') || lower.includes('what approval')) {
    title = 'World 2 Approval Requirements';
    goal = 'Define founder approval required before any future World 2 execution';
    outcome = 'Approval gate advisory — no activation performed';
  } else if (lower.includes('world 1 protected')) {
    title = 'World 1 Protection';
    goal = 'Verify World 1 control system remains protected from World 2 activation';
    outcome = 'Isolation confirmation — World 1 must not be modified';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    goal,
    requestedOutcome: outcome,
    sourceSystem: 'world2_execution_activation',
    activationOnly: true,
  };
}
