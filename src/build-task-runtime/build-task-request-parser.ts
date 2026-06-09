/**
 * Build task request parser — extracts planning intent from queries.
 */

import type { BuildTaskRequest } from './build-task-runtime-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `btreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetBuildTaskRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseBuildTaskRequest(query: string): BuildTaskRequest {
  const lower = query.toLowerCase().trim();
  let title = 'Build Task Planning Request';
  let goal = 'Plan a governed build task without execution';
  let outcome = 'Advisory build task plan with steps, dependencies, gates, and verification';

  if (lower.includes('plan the build') || lower.includes('plan this build')) {
    title = 'Plan the Build Task';
    goal = 'Define ordered build steps and prerequisites for a future governed build';
    outcome = 'Structured build task plan ready for simulation review';
  } else if (lower.includes('what steps')) {
    title = 'Build Step Analysis';
    goal = 'Identify required build steps and execution order';
    outcome = 'Ordered step list with dependency and safety references';
  } else if (lower.includes('implementation plan') || lower.includes('build sequence')) {
    title = 'Implementation Plan';
    goal = 'Sequence implementation steps with safety and verification gates';
    outcome = 'Implementation sequence plan — planning only';
  } else if (lower.includes('dependencies would this build')) {
    title = 'Build Dependency Analysis';
    goal = 'Resolve dependencies required before build task execution';
    outcome = 'Dependency list with satisfaction status';
  } else if (lower.includes('safety gates')) {
    title = 'Build Safety Gate Review';
    goal = 'Identify safety gates required before any future build execution';
    outcome = 'Safety gate checklist — advisory only';
  } else if (lower.includes('verification would prove')) {
    title = 'Build Verification Planning';
    goal = 'Define verification criteria that would prove a build succeeded';
    outcome = 'Verification plan with proof criteria and rollback considerations';
  } else if (lower.includes('can this build task execute') || lower.includes('build task execute')) {
    title = 'Build Task Execution Readiness';
    goal = 'Assess whether build task could execute in a future governed phase';
    outcome = 'Execution readiness advisory linked to execution packet — not allowed now';
  } else if (lower.includes('blocking this task') || lower.includes('what is blocking')) {
    title = 'Build Task Blocker Analysis';
    goal = 'Surface blockers preventing build task progression';
    outcome = 'Blocker report with linked execution packet state';
  } else if (lower.includes('task plan') || lower.includes('build task')) {
    title = 'Build Task Plan';
    goal = 'Compose full build task plan from intelligence sources';
    outcome = 'Complete build task plan with simulation-only state';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    goal,
    requestedOutcome: outcome,
    sourceSystem: 'build_task_runtime',
    planningOnly: true,
  };
}
