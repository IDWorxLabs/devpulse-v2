/**
 * Incremental Autonomous Builder — feature slice planning.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { FeatureSlicePlan } from './incremental-builder-types.js';

let sliceCounter = 0;

export function resetFeatureSlicePlannerForTests(): void {
  sliceCounter = 0;
}

function nextSliceId(): string {
  sliceCounter += 1;
  return `slice-${sliceCounter}`;
}

interface SliceTemplate {
  name: string;
  description: string;
  deps: string[];
  requirementPatterns: RegExp[];
  capabilityPatterns: RegExp[];
  acceptance: string[];
  validation: string[];
  repairPolicy: string;
}

const LISA_TEMPLATES: SliceTemplate[] = [
  {
    name: 'Core Communication Layout',
    description: 'Shared communication shell, layout, and navigation baseline',
    deps: [],
    requirementPatterns: [/layout|shell|communication/i],
    capabilityPatterns: [/accessibility|interaction/i],
    acceptance: ['Layout renders', 'Navigation shell present', 'Traceability anchors attached'],
    validation: ['TYPECHECK', 'BUILD', 'STATIC_STRUCTURE', 'ROUTE_CONNECTION'],
    repairPolicy: 'TARGETED_LAYOUT_PATCH',
  },
  {
    name: 'Blink Selection Input',
    description: 'Blink and gaze selection input flow',
    deps: ['Core Communication Layout'],
    requirementPatterns: [/blink|gaze|eye/i],
    capabilityPatterns: [/blink|eye track/i],
    acceptance: ['Blink input connected', 'Gaze selection simulated'],
    validation: ['TYPECHECK', 'INTERACTION_PRESENCE', 'CAPABILITY_COVERAGE'],
    repairPolicy: 'TARGETED_INPUT_PATCH',
  },
  {
    name: 'Emergency Phrase Workflow',
    description: 'Emergency speech phrase workflow',
    deps: ['Core Communication Layout', 'Blink Selection Input'],
    requirementPatterns: [/emergency/i],
    capabilityPatterns: [/emergency|phrase/i],
    acceptance: ['Emergency button present', 'Phrase workflow connected'],
    validation: ['BEHAVIOR', 'PROMPT_FAITHFULNESS', 'CAPABILITY_COVERAGE'],
    repairPolicy: 'TARGETED_WORKFLOW_PATCH',
  },
  {
    name: 'Speech Output',
    description: 'Text-to-speech output capability',
    deps: ['Core Communication Layout'],
    requirementPatterns: [/speech|tts|speak/i],
    capabilityPatterns: [/speech|tts/i],
    acceptance: ['Speak action connected', 'TTS service wired'],
    validation: ['TYPECHECK', 'STATE_CONNECTION', 'PROMPT_FAITHFULNESS'],
    repairPolicy: 'TARGETED_SERVICE_PATCH',
  },
  {
    name: 'Message History',
    description: 'Persistent communication history',
    deps: ['Core Communication Layout', 'Speech Output'],
    requirementPatterns: [/history|message/i],
    capabilityPatterns: [/history|storage/i],
    acceptance: ['History list renders', 'Messages persist locally'],
    validation: ['STORAGE', 'REGRESSION_GUARD', 'PROMPT_FAITHFULNESS'],
    repairPolicy: 'TARGETED_STORAGE_PATCH',
  },
  {
    name: 'Settings Persistence',
    description: 'User settings persistence',
    deps: ['Core Communication Layout'],
    requirementPatterns: [/settings|persist/i],
    capabilityPatterns: [/settings|storage/i],
    acceptance: ['Settings panel connected', 'Preferences persist'],
    validation: ['STATE_CONNECTION', 'STORAGE', 'REGRESSION_GUARD'],
    repairPolicy: 'TARGETED_SETTINGS_PATCH',
  },
  {
    name: 'Accessibility Scaling',
    description: 'Accessibility baseline scaling and contrast',
    deps: ['Core Communication Layout'],
    requirementPatterns: [/accessib|contrast|touch target/i],
    capabilityPatterns: [/accessib|large touch/i],
    acceptance: ['High contrast mode', 'Large touch targets', 'Keyboard navigation baseline'],
    validation: ['ACCESSIBILITY_BASELINE', 'PROMPT_FAITHFULNESS'],
    repairPolicy: 'TARGETED_A11Y_PATCH',
  },
  {
    name: 'Caregiver Mode',
    description: 'Caregiver communication workflow',
    deps: ['Message History', 'Settings Persistence'],
    requirementPatterns: [/caregiver/i],
    capabilityPatterns: [/caregiver|workflow/i],
    acceptance: ['Caregiver dashboard route', 'Alert workflow connected'],
    validation: ['ROUTE_CONNECTION', 'BEHAVIOR', 'REGRESSION_GUARD'],
    repairPolicy: 'TARGETED_WORKFLOW_PATCH',
  },
];

const EXPENSE_TEMPLATES: SliceTemplate[] = [
  {
    name: 'Expense Data Model',
    description: 'Expense entity model and storage schema',
    deps: [],
    requirementPatterns: [/expense|data|model/i],
    capabilityPatterns: [/crud|storage|local/i],
    acceptance: ['Expense type defined', 'Storage schema present'],
    validation: ['TYPECHECK', 'STATIC_STRUCTURE', 'CAPABILITY_COVERAGE'],
    repairPolicy: 'TARGETED_MODEL_PATCH',
  },
  {
    name: 'Create Expense',
    description: 'Create expense mutation flow',
    deps: ['Expense Data Model'],
    requirementPatterns: [/create/i],
    capabilityPatterns: [/crud/i],
    acceptance: ['Create form renders', 'Expense persisted on submit'],
    validation: ['TYPECHECK', 'STATE_CONNECTION', 'BEHAVIOR'],
    repairPolicy: 'TARGETED_CRUD_PATCH',
  },
  {
    name: 'Edit Expense',
    description: 'Edit expense mutation flow',
    deps: ['Expense Data Model', 'Create Expense'],
    requirementPatterns: [/edit/i],
    capabilityPatterns: [/crud/i],
    acceptance: ['Edit form renders', 'Expense updates persist'],
    validation: ['TYPECHECK', 'STATE_CONNECTION', 'REGRESSION_GUARD'],
    repairPolicy: 'TARGETED_CRUD_PATCH',
  },
  {
    name: 'Delete Expense',
    description: 'Delete expense mutation flow',
    deps: ['Expense Data Model', 'Create Expense'],
    requirementPatterns: [/delete/i],
    capabilityPatterns: [/crud/i],
    acceptance: ['Delete action present', 'Expense removed from store'],
    validation: ['TYPECHECK', 'BEHAVIOR', 'REGRESSION_GUARD'],
    repairPolicy: 'TARGETED_CRUD_PATCH',
  },
  {
    name: 'Expense List',
    description: 'Expense list and detail views',
    deps: ['Expense Data Model', 'Create Expense'],
    requirementPatterns: [/list|expense/i],
    capabilityPatterns: [/crud|reporting/i],
    acceptance: ['List renders expenses', 'Detail route connected'],
    validation: ['ROUTE_CONNECTION', 'PROMPT_FAITHFULNESS'],
    repairPolicy: 'TARGETED_UI_PATCH',
  },
  {
    name: 'Filters and Search',
    description: 'Filter and search over expenses',
    deps: ['Expense List'],
    requirementPatterns: [/filter|search|category/i],
    capabilityPatterns: [/crud|reporting/i],
    acceptance: ['Filters connected', 'Search narrows list'],
    validation: ['BEHAVIOR', 'REGRESSION_GUARD'],
    repairPolicy: 'TARGETED_FILTER_PATCH',
  },
  {
    name: 'Reports',
    description: 'Reporting dashboard and charts',
    deps: ['Expense List', 'Filters and Search'],
    requirementPatterns: [/report|chart|dashboard/i],
    capabilityPatterns: [/reporting/i],
    acceptance: ['Reports view renders', 'Charts bound to data'],
    validation: ['TYPECHECK', 'PROMPT_FAITHFULNESS', 'CAPABILITY_COVERAGE'],
    repairPolicy: 'TARGETED_REPORT_PATCH',
  },
  {
    name: 'Export',
    description: 'CSV export of expenses and reports',
    deps: ['Expense Data Model', 'Reports'],
    requirementPatterns: [/export|csv/i],
    capabilityPatterns: [/export|csv/i],
    acceptance: ['Export action present', 'CSV generated from data model'],
    validation: ['TYPECHECK', 'REGRESSION_GUARD', 'CAPABILITY_COVERAGE'],
    repairPolicy: 'TARGETED_EXPORT_PATCH',
  },
];

function mapRequirements(template: SliceTemplate, faithfulness?: PromptFaithfulnessV2Result): string[] {
  if (!faithfulness) return [];
  return faithfulness.requirements
    .filter((r) => template.requirementPatterns.some((p) => p.test(r.description)))
    .map((r) => r.requirementId);
}

function mapCapabilities(
  template: SliceTemplate,
  capabilityPlanning?: CapabilityPlanningPipelineResult,
): string[] {
  if (!capabilityPlanning) return [];
  return capabilityPlanning.requiredCapabilities
    .filter((c) => template.capabilityPatterns.some((p) => p.test(c.name)))
    .map((c) => c.requiredId);
}

function buildSlicesFromTemplates(
  templates: SliceTemplate[],
  faithfulness?: PromptFaithfulnessV2Result,
  capabilityPlanning?: CapabilityPlanningPipelineResult,
): FeatureSlicePlan[] {
  const nameToId = new Map<string, string>();
  const slices: FeatureSlicePlan[] = [];

  for (const template of templates) {
    const sliceId = nextSliceId();
    nameToId.set(template.name, sliceId);
    slices.push({
      readOnly: true,
      sliceId,
      name: template.name,
      description: template.description,
      orderIndex: slices.length,
      dependencySliceIds: [],
      requirementIds: mapRequirements(template, faithfulness),
      capabilityIds: mapCapabilities(template, capabilityPlanning),
      acceptanceCriteria: template.acceptance,
      validationPlan: template.validation,
      repairPolicy: template.repairPolicy,
      commitBoundary: `commit-${sliceId}`,
      rollbackBoundary: `rollback-${sliceId}`,
    });
  }

  return slices.map((slice) => {
    const template = templates.find((t) => t.name === slice.name);
    const deps = template?.deps ?? [];
    return {
      ...slice,
      dependencySliceIds: deps.map((d) => nameToId.get(d) ?? '').filter(Boolean),
    };
  });
}

export function planFeatureSlices(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  capabilityPlanning?: CapabilityPlanningPipelineResult;
}): FeatureSlicePlan[] {
  if (promptMentionsLisaOrAccessibility(input.rawPrompt) ||
      input.productIntelligenceModel?.productType === 'ASSISTIVE_COMMUNICATION') {
    return buildSlicesFromTemplates(LISA_TEMPLATES, input.promptFaithfulness, input.capabilityPlanning);
  }

  if (/expense|finance|income|tracker/i.test(input.rawPrompt) ||
      input.productIntelligenceModel?.productType === 'EXPENSE_TRACKER' ||
      input.productIntelligenceModel?.productType === 'FINANCE_TRACKER') {
    return buildSlicesFromTemplates(EXPENSE_TEMPLATES, input.promptFaithfulness, input.capabilityPlanning);
  }

  const generic: SliceTemplate[] = [
    {
      name: 'Core Shell',
      description: 'Application shell and routing',
      deps: [],
      requirementPatterns: [/.*/],
      capabilityPatterns: [/.*/],
      acceptance: ['Shell compiles', 'Routes registered'],
      validation: ['TYPECHECK', 'BUILD'],
      repairPolicy: 'TARGETED_SHELL_PATCH',
    },
    {
      name: 'Primary Feature',
      description: 'Primary prompt-driven feature slice',
      deps: ['Core Shell'],
      requirementPatterns: [/.*/],
      capabilityPatterns: [/.*/],
      acceptance: ['Primary feature connected'],
      validation: ['PROMPT_FAITHFULNESS', 'BEHAVIOR'],
      repairPolicy: 'TARGETED_FEATURE_PATCH',
    },
  ];

  return buildSlicesFromTemplates(generic, input.promptFaithfulness, input.capabilityPlanning);
}
