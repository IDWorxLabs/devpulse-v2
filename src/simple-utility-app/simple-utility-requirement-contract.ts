/**
 * Simple utility app — user idea and requirement contract builders.
 */

import {
  detectSimpleUtilityAppKind,
  simpleUtilityAppTitle,
  simpleUtilityNormalizedGoal,
  type SimpleUtilityAppKind,
} from './simple-utility-app-registry.js';

let reqCounter = 0;

export function resetSimpleUtilityRequirementCounterForTests(): void {
  reqCounter = 0;
}

function req(
  sourceIdeaId: string,
  requirementType: RequirementType,
  description: string,
  priority: RequirementContractEntry['priority'],
  acceptanceCriteria: string[],
  evidenceSource: string,
  status: RequirementContractEntry['status'] = 'EXTRACTED',
): RequirementContractEntry {
  reqCounter += 1;
  return {
    readOnly: true,
    requirementId: `req-simple-${String(reqCounter).padStart(3, '0')}`,
    sourceIdeaId,
    requirementType,
    description,
    priority,
    acceptanceCriteria,
    evidenceSource,
    status,
  };
}

function calculatorRequirements(ideaId: string): RequirementContractEntry[] {
  return [
    req(
      ideaId,
      'FUNCTIONAL',
      'Calculator UI with number input buttons 0-9',
      'CRITICAL',
      ['Number buttons render on screen', 'Tapping a number updates the display'],
      'prompt:calculator numbers',
    ),
    req(
      ideaId,
      'FUNCTIONAL',
      'Arithmetic operators plus, minus, multiply, and divide',
      'CRITICAL',
      ['+ − × ÷ operator buttons are available', 'Selecting an operator prepares the next operand'],
      'prompt:calculator operators',
    ),
    req(
      ideaId,
      'FUNCTIONAL',
      'Clear and delete controls',
      'CRITICAL',
      ['Clear resets the calculator state', 'Delete removes the last entered digit'],
      'prompt:calculator clear',
    ),
    req(
      ideaId,
      'FUNCTIONAL',
      'Equals computes and displays the result',
      'CRITICAL',
      ['Equals evaluates the current expression', 'Result is shown in the calculator display'],
      'prompt:calculator equals',
    ),
    req(
      ideaId,
      'UI_UX',
      'Responsive calculator layout for browser screens',
      'HIGH',
      ['Layout adapts to narrow and wide viewports', 'Buttons remain tappable on mobile widths'],
      'prompt:calculator responsive',
    ),
    req(
      ideaId,
      'PLATFORM',
      'Browser web application with Vite React entrypoint',
      'CRITICAL',
      ['App mounts from src/main.tsx', 'npm run build produces static preview assets'],
      'prompt:calculator web app',
    ),
    req(
      ideaId,
      'DEPLOYMENT',
      'package.json with install and build scripts',
      'CRITICAL',
      ['package.json defines npm install dependencies', 'npm run build script succeeds'],
      'inferred:package.json',
      'INFERRED',
    ),
    req(
      ideaId,
      'NON_FUNCTIONAL',
      'Live preview path serves built HTML',
      'HIGH',
      ['Preview URL returns HTTP 200', 'Built index.html is reachable after npm run build'],
      'inferred:preview path',
    ),
  ];
}

function todoRequirements(ideaId: string): RequirementContractEntry[] {
  return [
    req(ideaId, 'FUNCTIONAL', 'Add todo items', 'CRITICAL', ['User can add a todo', 'Todo appears in list'], 'prompt:todo'),
    req(ideaId, 'FUNCTIONAL', 'Mark todos complete', 'CRITICAL', ['User can toggle completion'], 'prompt:todo complete'),
    req(ideaId, 'FUNCTIONAL', 'Delete todos', 'HIGH', ['User can delete a todo'], 'prompt:todo delete'),
    req(ideaId, 'UI_UX', 'Responsive todo list UI', 'HIGH', ['Layout works in browser'], 'prompt:todo ui'),
    req(ideaId, 'PLATFORM', 'Browser web application', 'CRITICAL', ['Runs in modern browser'], 'prompt:todo web'),
    req(ideaId, 'DEPLOYMENT', 'package.json build scripts', 'CRITICAL', ['npm run build succeeds'], 'inferred:package.json'),
  ];
}

function notesRequirements(ideaId: string): RequirementContractEntry[] {
  return [
    req(ideaId, 'FUNCTIONAL', 'Create and edit notes', 'CRITICAL', ['User can create a note', 'User can edit note text'], 'prompt:notes'),
    req(ideaId, 'FUNCTIONAL', 'Delete notes', 'HIGH', ['User can delete a note'], 'prompt:notes delete'),
    req(ideaId, 'UI_UX', 'Responsive notes editor UI', 'HIGH', ['Editor usable on mobile widths'], 'prompt:notes ui'),
    req(ideaId, 'PLATFORM', 'Browser web application', 'CRITICAL', ['Runs in modern browser'], 'prompt:notes web'),
    req(ideaId, 'DEPLOYMENT', 'package.json build scripts', 'CRITICAL', ['npm run build succeeds'], 'inferred:package.json'),
  ];
}

function timerRequirements(ideaId: string): RequirementContractEntry[] {
  return [
    req(ideaId, 'FUNCTIONAL', 'Start, pause, and reset timer', 'CRITICAL', ['Timer can start', 'Timer can pause', 'Timer can reset'], 'prompt:timer'),
    req(ideaId, 'UI_UX', 'Visible countdown display', 'HIGH', ['Elapsed/remaining time is shown'], 'prompt:timer display'),
    req(ideaId, 'PLATFORM', 'Browser web application', 'CRITICAL', ['Runs in modern browser'], 'prompt:timer web'),
    req(ideaId, 'DEPLOYMENT', 'package.json build scripts', 'CRITICAL', ['npm run build succeeds'], 'inferred:package.json'),
  ];
}

function counterRequirements(ideaId: string): RequirementContractEntry[] {
  return [
    req(ideaId, 'FUNCTIONAL', 'Increment and decrement counter', 'CRITICAL', ['Counter increases', 'Counter decreases'], 'prompt:counter'),
    req(ideaId, 'FUNCTIONAL', 'Reset counter', 'HIGH', ['Counter resets to zero'], 'prompt:counter reset'),
    req(ideaId, 'UI_UX', 'Responsive counter controls', 'HIGH', ['Controls usable on mobile widths'], 'prompt:counter ui'),
    req(ideaId, 'PLATFORM', 'Browser web application', 'CRITICAL', ['Runs in modern browser'], 'prompt:counter web'),
    req(ideaId, 'DEPLOYMENT', 'package.json build scripts', 'CRITICAL', ['npm run build succeeds'], 'inferred:package.json'),
  ];
}

function requirementsForKind(ideaId: string, kind: SimpleUtilityAppKind): RequirementContractEntry[] {
  switch (kind) {
    case 'calculator':
      return calculatorRequirements(ideaId);
    case 'todo':
      return todoRequirements(ideaId);
    case 'notes':
      return notesRequirements(ideaId);
    case 'timer':
      return timerRequirements(ideaId);
    case 'counter':
      return counterRequirements(ideaId);
  }
}

export function buildSimpleUtilityUserIdeaContract(
  rawPrompt: string,
  kind: SimpleUtilityAppKind,
  ideaId: string,
): UserIdeaContract {
  return {
    readOnly: true,
    ideaId,
    rawPrompt: rawPrompt.trim().replace(/\s+/g, ' '),
    normalizedGoal: simpleUtilityNormalizedGoal(kind),
    problemStatement: `User wants a ${simpleUtilityAppTitle(kind).toLowerCase()} that works in the browser`,
    desiredOutcome: `Working ${simpleUtilityAppTitle(kind)} with prompt-specific controls and npm build output`,
    productType: 'WEB_APPLICATION',
    targetUsers: ['Individual users needing a lightweight browser utility'],
    platformHints: ['Web'],
    knownConstraints: ['MVP single-screen utility'],
    unknowns: [],
    confidence: 88,
    status: 'CAPTURED',
  };
}

export function buildSimpleUtilityRequirementContract(
  idea: UserIdeaContract,
  kind?: SimpleUtilityAppKind,
): RequirementContract | null {
  const resolvedKind = kind ?? detectSimpleUtilityAppKind(idea.rawPrompt);
  if (!resolvedKind) return null;

  const requirements = requirementsForKind(idea.ideaId, resolvedKind);
  return {
    readOnly: true,
    contractId: `requirement-contract-simple-${resolvedKind}-${idea.ideaId}`,
    sourceIdeaId: idea.ideaId,
    requirements,
  };
}
