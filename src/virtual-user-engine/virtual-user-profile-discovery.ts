/**
 * Virtual User Engine — virtual user profile discovery.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualUserProfile } from './virtual-user-types.js';

let userCounter = 0;

export function resetVirtualUserProfileDiscoveryForTests(): void {
  userCounter = 0;
}

function nextUserId(): string {
  userCounter += 1;
  return `vuser-${userCounter}`;
}

const LISA_USERS: Omit<VirtualUserProfile, 'readOnly' | 'userId'>[] = [
  {
    role: 'Locked-in syndrome patient',
    description: 'Primary assistive communication user with severe motor limitations',
    sourceRequirementIds: [],
    productGoals: ['Communicate basic phrases', 'Trigger emergency speech', 'Use accessible input'],
    primaryWorkflows: ['Blink selection', 'Emergency phrase', 'Speech output', 'Message history'],
    accessibilityNeeds: ['Large touch targets', 'Blink input', 'High contrast', 'Minimal steps'],
    deviceContext: 'PHONE_FIRST',
    skillLevel: 'NOVICE',
    constraints: ['Cannot type normally', 'High fatigue risk', 'Needs clear confirmation'],
    successCriteria: ['Phrase spoken', 'Emergency accessible', 'History updated'],
    riskLevel: 'HIGH',
  },
  {
    role: 'Caregiver',
    description: 'Caregiver configuring and monitoring communication',
    sourceRequirementIds: [],
    productGoals: ['Adjust settings', 'Review message history', 'Configure communication options'],
    primaryWorkflows: ['Settings persistence', 'Caregiver dashboard', 'Message history review'],
    accessibilityNeeds: ['Clear navigation', 'Readable labels'],
    deviceContext: 'WEB',
    skillLevel: 'INTERMEDIATE',
    constraints: ['Limited setup time'],
    successCriteria: ['Settings saved', 'History reviewable'],
    riskLevel: 'MEDIUM',
  },
  {
    role: 'Family member',
    description: 'Family member checking communication status',
    sourceRequirementIds: [],
    productGoals: ['View communication history'],
    primaryWorkflows: ['Message history'],
    accessibilityNeeds: ['Simple navigation'],
    deviceContext: 'WEB',
    skillLevel: 'INTERMEDIATE',
    constraints: ['Occasional use'],
    successCriteria: ['History visible'],
    riskLevel: 'LOW',
  },
];

const EXPENSE_USERS: Omit<VirtualUserProfile, 'readOnly' | 'userId'>[] = [
  {
    role: 'Small business owner',
    description: 'Owner tracking daily business expenses',
    sourceRequirementIds: [],
    productGoals: ['Add expense', 'Edit mistakes', 'Delete entries', 'View totals', 'Export report'],
    primaryWorkflows: ['Create expense', 'Edit expense', 'Delete expense', 'Reports', 'Export'],
    accessibilityNeeds: ['Clear forms', 'Obvious totals'],
    deviceContext: 'WEB',
    skillLevel: 'INTERMEDIATE',
    constraints: ['Limited time', 'Needs quick entry and correction'],
    successCriteria: ['Expense saved', 'Totals accurate', 'Export available'],
    riskLevel: 'MEDIUM',
  },
  {
    role: 'Accountant',
    description: 'Accountant reviewing and exporting expense data',
    sourceRequirementIds: [],
    productGoals: ['Export reports', 'Review expense list'],
    primaryWorkflows: ['Reports', 'Export', 'Filters and search'],
    accessibilityNeeds: ['Data clarity'],
    deviceContext: 'WEB',
    skillLevel: 'EXPERT',
    constraints: ['Needs reliable export'],
    successCriteria: ['Export generated', 'Data complete'],
    riskLevel: 'LOW',
  },
];

export function discoverVirtualUserProfiles(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
}): VirtualUserProfile[] {
  const mapReqs = (profile: Omit<VirtualUserProfile, 'readOnly' | 'userId'>): VirtualUserProfile => {
    const reqs = input.promptFaithfulness?.requirements
      .filter((r) => profile.productGoals.some((g) => r.description.toLowerCase().includes(g.split(' ')[0]?.toLowerCase() ?? '')))
      .map((r) => r.requirementId) ?? [];
    return {
      readOnly: true,
      userId: nextUserId(),
      ...profile,
      sourceRequirementIds: reqs.length ? reqs : profile.sourceRequirementIds,
    };
  };

  if (promptMentionsLisaOrAccessibility(input.rawPrompt) ||
      input.productIntelligenceModel?.product.productType === 'ASSISTIVE_COMMUNICATION') {
    return LISA_USERS.map(mapReqs);
  }
  if (/expense|finance|tracker/i.test(input.rawPrompt) ||
      input.productIntelligenceModel?.product.productType === 'EXPENSE_TRACKER') {
    return EXPENSE_USERS.map(mapReqs);
  }

  return [
    mapReqs({
      role: 'Primary user',
      description: 'Default product user',
      sourceRequirementIds: [],
      productGoals: ['Complete primary workflow'],
      primaryWorkflows: ['Primary feature'],
      accessibilityNeeds: [],
      deviceContext: 'WEB',
      skillLevel: 'INTERMEDIATE',
      constraints: [],
      successCriteria: ['Primary goal completed'],
      riskLevel: 'LOW',
    }),
  ];
}
