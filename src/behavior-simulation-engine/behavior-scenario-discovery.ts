/**
 * Behavior Simulation Engine — behavior scenario discovery.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { BehaviorScenario } from './behavior-simulation-types.js';

let scenarioCounter = 0;

export function resetBehaviorScenarioDiscoveryForTests(): void {
  scenarioCounter = 0;
}

function nextScenarioId(): string {
  scenarioCounter += 1;
  return `beh-scenario-${scenarioCounter}`;
}

interface ScenarioTemplate {
  name: string;
  userGoal: string;
  preconditions: string[];
  actionSteps: string[];
  expectedStateChanges: string[];
  expectedServiceEffects: string[];
  expectedDataUpdates: string[];
  expectedUiResults: string[];
  priority: BehaviorScenario['validationPriority'];
  sliceNamePattern: RegExp;
  capabilityPattern: RegExp;
  requirementPattern: RegExp;
}

const EXPENSE_TEMPLATES: ScenarioTemplate[] = [
  {
    name: 'Create expense',
    userGoal: 'Add a new business expense',
    preconditions: ['Empty or populated expense list'],
    actionSteps: ['Click Add Expense', 'Enter amount, category, description', 'Click Save'],
    expectedStateChanges: ['Expense count increased', 'Form closed'],
    expectedServiceEffects: ['SaveExpenseService called'],
    expectedDataUpdates: ['Expense record added'],
    expectedUiResults: ['New expense appears in list'],
    priority: 'CRITICAL',
    sliceNamePattern: /create expense/i,
    capabilityPattern: /crud/i,
    requirementPattern: /create|expense/i,
  },
  {
    name: 'Edit expense',
    userGoal: 'Modify an existing expense',
    preconditions: ['At least one expense exists'],
    actionSteps: ['Click Edit', 'Change amount', 'Click Save'],
    expectedStateChanges: ['Expense amount updated'],
    expectedServiceEffects: ['UpdateExpenseService called'],
    expectedDataUpdates: ['Expense record edited'],
    expectedUiResults: ['List reflects new value'],
    priority: 'CRITICAL',
    sliceNamePattern: /edit expense/i,
    capabilityPattern: /crud/i,
    requirementPattern: /edit/i,
  },
  {
    name: 'Delete expense',
    userGoal: 'Remove an expense',
    preconditions: ['At least one expense exists'],
    actionSteps: ['Click Delete', 'Confirm deletion'],
    expectedStateChanges: ['Expense count decreased'],
    expectedServiceEffects: ['DeleteExpenseService called'],
    expectedDataUpdates: ['Expense record deleted'],
    expectedUiResults: ['Expense removed from list'],
    priority: 'CRITICAL',
    sliceNamePattern: /delete expense/i,
    capabilityPattern: /crud/i,
    requirementPattern: /delete/i,
  },
  {
    name: 'Search expenses',
    userGoal: 'Find expenses by filter or search',
    preconditions: ['Expense list loaded'],
    actionSteps: ['Open filters', 'Enter search term', 'Apply filter'],
    expectedStateChanges: ['Filtered list state active'],
    expectedServiceEffects: ['FilterExpenseService called'],
    expectedDataUpdates: [],
    expectedUiResults: ['List shows matching expenses only'],
    priority: 'HIGH',
    sliceNamePattern: /filter|search/i,
    capabilityPattern: /crud|report/i,
    requirementPattern: /filter|search|category/i,
  },
  {
    name: 'Export report',
    userGoal: 'Export expenses to CSV',
    preconditions: ['Reports or list with data available'],
    actionSteps: ['Navigate to Reports', 'Click Export'],
    expectedStateChanges: ['Export completed state'],
    expectedServiceEffects: ['ExportService generated file'],
    expectedDataUpdates: ['Export payload generated'],
    expectedUiResults: ['Export button shows completed state'],
    priority: 'HIGH',
    sliceNamePattern: /export/i,
    capabilityPattern: /export|csv/i,
    requirementPattern: /export|csv|report/i,
  },
];

const LISA_TEMPLATES: ScenarioTemplate[] = [
  {
    name: 'Select blink option',
    userGoal: 'Select communication option via blink input',
    preconditions: ['Communication board loaded'],
    actionSteps: ['Focus blink target', 'Simulate blink selection'],
    expectedStateChanges: ['Selected option updated'],
    expectedServiceEffects: ['BlinkInputService called'],
    expectedDataUpdates: [],
    expectedUiResults: ['Selected option highlighted'],
    priority: 'CRITICAL',
    sliceNamePattern: /blink/i,
    capabilityPattern: /blink|eye/i,
    requirementPattern: /blink|gaze/i,
  },
  {
    name: 'Trigger emergency phrase',
    userGoal: 'Send emergency speech phrase',
    preconditions: ['Communication board loaded'],
    actionSteps: ['Select emergency phrase', 'Trigger speak'],
    expectedStateChanges: ['Emergency phrase selected'],
    expectedServiceEffects: ['EmergencyWorkflowService executed', 'SpeechOutputService triggered'],
    expectedDataUpdates: ['Emergency message added to history'],
    expectedUiResults: ['UI confirms message sent'],
    priority: 'CRITICAL',
    sliceNamePattern: /emergency/i,
    capabilityPattern: /emergency|speech/i,
    requirementPattern: /emergency/i,
  },
  {
    name: 'Speak selected message',
    userGoal: 'Speak composed message via TTS',
    preconditions: ['Message composed or phrase selected'],
    actionSteps: ['Click Speak button'],
    expectedStateChanges: ['Speech output active'],
    expectedServiceEffects: ['SpeechOutputService triggered'],
    expectedDataUpdates: ['Message history appended'],
    expectedUiResults: ['Speech indicator visible'],
    priority: 'CRITICAL',
    sliceNamePattern: /speech|communication layout/i,
    capabilityPattern: /speech|tts/i,
    requirementPattern: /speech|speak|tts/i,
  },
  {
    name: 'Save settings',
    userGoal: 'Persist accessibility settings',
    preconditions: ['Settings panel open'],
    actionSteps: ['Open settings', 'Change text size', 'Save settings'],
    expectedStateChanges: ['Settings value changed'],
    expectedServiceEffects: ['SettingsService persisted value'],
    expectedDataUpdates: ['Settings persisted'],
    expectedUiResults: ['Text size remains after reload'],
    priority: 'HIGH',
    sliceNamePattern: /settings/i,
    capabilityPattern: /settings|storage/i,
    requirementPattern: /settings|persist/i,
  },
  {
    name: 'View message history',
    userGoal: 'Review communication history',
    preconditions: ['At least one message sent'],
    actionSteps: ['Navigate to history', 'View messages'],
    expectedStateChanges: ['History route active'],
    expectedServiceEffects: ['HistoryService loaded records'],
    expectedDataUpdates: [],
    expectedUiResults: ['History list visible with messages'],
    priority: 'HIGH',
    sliceNamePattern: /message history|history/i,
    capabilityPattern: /history|message/i,
    requirementPattern: /history|message/i,
  },
];

function mapSliceIds(template: ScenarioTemplate, incremental?: IncrementalBuildPipelineResult): string[] {
  if (!incremental) return [];
  return incremental.buildPlan.featureSlices
    .filter((s) => template.sliceNamePattern.test(s.name))
    .map((s) => s.sliceId);
}

function mapRequirementIds(template: ScenarioTemplate, faithfulness?: PromptFaithfulnessV2Result): string[] {
  if (!faithfulness) return [];
  return faithfulness.requirements
    .filter((r) => template.requirementPattern.test(r.description))
    .map((r) => r.requirementId);
}

function mapCapabilityIds(template: ScenarioTemplate, incremental?: IncrementalBuildPipelineResult): string[] {
  if (!incremental) return [];
  const caps = new Set<string>();
  for (const slice of incremental.buildPlan.featureSlices) {
    if (template.sliceNamePattern.test(slice.name)) {
      for (const id of slice.capabilityIds) caps.add(id);
    }
  }
  return [...caps];
}

function fromTemplates(
  templates: ScenarioTemplate[],
  faithfulness?: PromptFaithfulnessV2Result,
  incremental?: IncrementalBuildPipelineResult,
): BehaviorScenario[] {
  return templates.map((t) => ({
    readOnly: true as const,
    scenarioId: nextScenarioId(),
    name: t.name,
    sourceRequirementIds: mapRequirementIds(t, faithfulness),
    featureSliceIds: mapSliceIds(t, incremental),
    capabilityIds: mapCapabilityIds(t, incremental),
    userGoal: t.userGoal,
    preconditions: t.preconditions,
    actionSteps: t.actionSteps,
    expectedStateChanges: t.expectedStateChanges,
    expectedServiceEffects: t.expectedServiceEffects,
    expectedDataUpdates: t.expectedDataUpdates,
    expectedUiResults: t.expectedUiResults,
    validationPriority: t.priority,
  }));
}

export function discoverBehaviorScenarios(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  incrementalBuild?: IncrementalBuildPipelineResult;
}): BehaviorScenario[] {
  if (promptMentionsLisaOrAccessibility(input.rawPrompt) ||
      input.productIntelligenceModel?.product.productType === 'ASSISTIVE_COMMUNICATION') {
    return fromTemplates(LISA_TEMPLATES, input.promptFaithfulness, input.incrementalBuild);
  }
  if (/expense|finance|tracker/i.test(input.rawPrompt) ||
      input.productIntelligenceModel?.product.productType === 'EXPENSE_TRACKER') {
    return fromTemplates(EXPENSE_TEMPLATES, input.promptFaithfulness, input.incrementalBuild);
  }
  return fromTemplates(
    [
      {
        name: 'Primary workflow',
        userGoal: 'Execute primary prompt workflow',
        preconditions: ['App loaded'],
        actionSteps: ['Navigate to primary feature', 'Execute main action'],
        expectedStateChanges: ['Primary state updated'],
        expectedServiceEffects: ['PrimaryService called'],
        expectedDataUpdates: ['Primary data updated'],
        expectedUiResults: ['Primary UI updated'],
        priority: 'HIGH',
        sliceNamePattern: /.*/,
        capabilityPattern: /.*/,
        requirementPattern: /.*/,
      },
    ],
    input.promptFaithfulness,
    input.incrementalBuild,
  );
}
