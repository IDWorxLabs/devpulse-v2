/**
 * Intent Understanding Engine — workflow extraction.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type {
  UserWorkflowUnderstanding,
  WorkflowStep,
  UnderstandingEvidence,
} from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

function buildSteps(labels: string[], optionalFrom?: number): WorkflowStep[] {
  return labels.map((label, index) => ({
    readOnly: true,
    stepId: `step-${index + 1}`,
    label,
    order: index + 1,
    optional: optionalFrom !== undefined && index >= optionalFrom,
  }));
}

function extractLisaWorkflow(): UserWorkflowUnderstanding {
  return {
    readOnly: true,
    workflowId: 'lisa-primary-communication',
    name: 'Assistive Communication Flow',
    steps: buildSteps([
      'Open App',
      'Authenticate / Resume Session',
      'Calibrate Eye Tracking',
      'Select Tile via Gaze or Blink',
      'Compose Sentence',
      'Speak Sentence',
      'Store in Communication History',
      'Complete',
    ], 6),
    evidence: [evidence('domain_template', 'LISA assistive communication workflow', 1)],
  };
}

function extractGenericWorkflow(rawPrompt: string): UserWorkflowUnderstanding {
  const steps = ['Open App'];
  if (/auth|login|sign[\s-]?in/i.test(rawPrompt)) steps.push('Authenticate');
  if (/onboard|welcome|setup/i.test(rawPrompt)) steps.push('Complete Onboarding');
  steps.push('View Dashboard');
  if (/create|add|new record/i.test(rawPrompt)) steps.push('Create Record');
  if (/review|view|browse/i.test(rawPrompt)) steps.push('Review');
  if (/edit|update|modify/i.test(rawPrompt)) steps.push('Edit');
  if (/search|filter/i.test(rawPrompt)) steps.push('Search / Filter');
  if (/export|download/i.test(rawPrompt)) steps.push('Export');
  steps.push('Complete');

  return {
    readOnly: true,
    workflowId: 'primary-user-workflow',
    name: 'Primary User Workflow',
    steps: buildSteps(steps, steps.length - 1),
    evidence: [evidence('prompt_inference', `Inferred ${steps.length}-step workflow from prompt signals`, 0.85)],
  };
}

export function extractWorkflows(rawPrompt: string): UserWorkflowUnderstanding[] {
  const workflows: UserWorkflowUnderstanding[] = [];

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    workflows.push(extractLisaWorkflow());
  } else {
    workflows.push(extractGenericWorkflow(rawPrompt));
  }

  if (/caregiver/i.test(rawPrompt)) {
    workflows.push({
      readOnly: true,
      workflowId: 'caregiver-monitoring',
      name: 'Caregiver Monitoring Workflow',
      steps: buildSteps([
        'Open Caregiver Dashboard',
        'Review Communication History',
        'Adjust Accessibility Settings',
        'Export or Share Report',
      ]),
      evidence: [evidence('prompt_analysis', 'Caregiver workflow detected', 0.9)],
    });
  }

  const extraction = extractPromptFeatures(rawPrompt);
  if (extraction.explicitModulesProvided && extraction.requiredModules.length >= 3) {
    workflows.push({
      readOnly: true,
      workflowId: 'module-navigation-workflow',
      name: 'Feature Module Navigation',
      steps: buildSteps([
        'Open App',
        ...extraction.requiredModules.slice(0, 6).map((m) => `Navigate to ${m}`),
        'Complete Session',
      ]),
      evidence: [evidence('module_extraction', `Modules: ${extraction.requiredModules.join(', ')}`, 1)],
    });
  }

  return workflows;
}
