/**
 * Code generation request parser — extracts proposal intent from queries.
 */

import type { CodeGenerationRequest } from './code-generation-runtime-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `cgenreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetCodeGenerationRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseCodeGenerationRequest(query: string): CodeGenerationRequest {
  const lower = query.toLowerCase().trim();
  let title = 'Code Generation Planning Request';
  let goal = 'Plan governed code generation proposals without writing project files';
  let outcome = 'Advisory code generation plan with artifacts, changes, strategy, risks, and validation';

  if (lower.includes('generate code')) {
    title = 'Generate Code Proposal';
    goal = 'Propose code artifacts and file changes for a feature — simulation only';
    outcome = 'In-memory code generation proposal — no real files modified';
  } else if (lower.includes('what code would be generated')) {
    title = 'Code Artifact Analysis';
    goal = 'Describe what code artifacts would be generated for the requested outcome';
    outcome = 'Artifact proposal list with summaries — proposal only';
  } else if (lower.includes('what files would change') || lower.includes('target files')) {
    title = 'Target File Proposal';
    goal = 'Identify proposed target files and change types without applying patches';
    outcome = 'Target file and change proposal list — no file writes';
  } else if (lower.includes('what changes are proposed') || lower.includes('proposed changes')) {
    title = 'Change Proposal Review';
    goal = 'Summarize proposed code changes as advisory descriptions';
    outcome = 'Change proposal descriptions — not applied to project source';
  } else if (lower.includes('generation strategy')) {
    title = 'Generation Strategy Selection';
    goal = 'Select advisory generation strategy for future governed code generation';
    outcome = 'Strategy recommendation with risks and validation requirements';
  } else if (lower.includes('validation would prove') || lower.includes('prove the generated code')) {
    title = 'Code Generation Validation Planning';
    goal = 'Define validation that would prove generated code works — without running generation';
    outcome = 'Validation plan with proof criteria and rollback considerations';
  } else if (lower.includes('can this code generation run') || lower.includes('code generation run')) {
    title = 'Code Generation Readiness';
    goal = 'Assess whether code generation could run in a future governed phase';
    outcome = 'Readiness advisory — generation blocked, simulation only';
  } else if (lower.includes('blocking code generation') || lower.includes('what is blocking code')) {
    title = 'Code Generation Blocker Analysis';
    goal = 'Surface blockers preventing code generation progression';
    outcome = 'Blocker report linked to build task and execution packet';
  } else if (lower.includes('implementation proposal') || lower.includes('code artifact')) {
    title = 'Implementation Code Proposal';
    goal = 'Propose implementation code artifacts and changes for review';
    outcome = 'Full implementation proposal — proposal only, no apply';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    goal,
    requestedOutcome: outcome,
    sourceSystem: 'code_generation_runtime',
    proposalOnly: true,
  };
}
