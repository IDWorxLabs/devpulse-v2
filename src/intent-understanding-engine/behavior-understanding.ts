/**
 * Intent Understanding Engine — behavior model builder.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { BehaviorModelUnderstanding, BehaviorStep, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

function buildLisaBehavior(): BehaviorModelUnderstanding {
  const behaviors: BehaviorStep[] = [
    { readOnly: true, stepId: 'b1', trigger: 'Blink detected', action: 'Select tile on communication board', outcome: 'Tile highlighted', order: 1 },
    { readOnly: true, stepId: 'b2', trigger: 'Tile selected', action: 'Append word to sentence composer', outcome: 'Sentence updated', order: 2 },
    { readOnly: true, stepId: 'b3', trigger: 'Speak button pressed', action: 'Invoke text-to-speech', outcome: 'Sentence spoken aloud', order: 3 },
    { readOnly: true, stepId: 'b4', trigger: 'Speech completed', action: 'Store message in communication history', outcome: 'History record created', order: 4 },
    { readOnly: true, stepId: 'b5', trigger: 'Emergency button pressed', action: 'Trigger emergency speech phrase', outcome: 'Emergency message spoken', order: 5 },
  ];

  return {
    readOnly: true,
    behaviors,
    primaryFlow: ['Blink detected', 'Select tile', 'Compose sentence', 'Speak sentence', 'Store history', 'PASS'],
    evidence: [evidence('domain_template', 'LISA assistive communication behavior chain', 1)],
  };
}

function buildGenericBehavior(rawPrompt: string): BehaviorModelUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const behaviors: BehaviorStep[] = [];
  let order = 0;

  const addBehavior = (trigger: string, action: string, outcome: string): void => {
    order += 1;
    behaviors.push({
      readOnly: true,
      stepId: `b${order}`,
      trigger,
      action,
      outcome,
      order,
    });
  };

  addBehavior('User opens application', 'Load primary view', 'Dashboard displayed');
  if (/create|add/i.test(rawPrompt)) {
    addBehavior('User initiates create action', 'Open create form', 'New record form displayed');
    addBehavior('User submits form', 'Validate and persist data', 'Record saved');
  }
  if (/search|filter/i.test(rawPrompt)) {
    addBehavior('User enters search query', 'Filter records', 'Matching results displayed');
  }
  if (/edit|update/i.test(rawPrompt)) {
    addBehavior('User selects record', 'Open edit view', 'Record editable');
    addBehavior('User saves changes', 'Persist updates', 'Record updated');
  }
  addBehavior('Primary task completed', 'Update UI state', 'Success feedback shown');

  const primaryFlow = behaviors.map((b) => b.trigger);
  primaryFlow.push('PASS');

  return {
    readOnly: true,
    behaviors,
    primaryFlow,
    evidence: [
      evidence('prompt_inference', `Behavior model for ${extraction.appName}`, 0.85),
    ],
  };
}

export function buildBehaviorModel(rawPrompt: string): BehaviorModelUnderstanding {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return buildLisaBehavior();
  }
  return buildGenericBehavior(rawPrompt);
}
