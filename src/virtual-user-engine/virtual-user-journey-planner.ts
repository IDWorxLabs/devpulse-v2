/**
 * Virtual User Engine — journey planning.
 */

import {
  DEFAULT_JOURNEY_STEP_BUDGET,
  DEFAULT_JOURNEY_TIME_BUDGET_MS,
  type VirtualUserGoal,
  type VirtualUserJourney,
  type VirtualUserPersona,
} from './virtual-user-types.js';

let journeyCounter = 0;

const JOURNEY_TEMPLATES: Record<string, string[]> = {
  'add expense': ['Open app', 'Navigate to expenses', 'Click Add Expense', 'Enter amount and category', 'Save expense', 'Verify expense in list'],
  'edit': ['Open expense list', 'Select expense', 'Click Edit', 'Change amount', 'Save', 'Verify updated list'],
  'delete': ['Open expense list', 'Select expense', 'Click Delete', 'Confirm deletion', 'Verify removed from list'],
  'export': ['Open reports', 'Review totals', 'Click Export', 'Confirm export available'],
  'communicate': ['Open communication board', 'Select phrase', 'Trigger speak', 'Verify speech output', 'Confirm history updated'],
  'emergency': ['Open communication board', 'Navigate to emergency phrase', 'Select emergency phrase', 'Trigger speech', 'Verify history and confirmation'],
  'settings': ['Open settings', 'Change text size', 'Save settings', 'Reload and verify persistence'],
  'history': ['Navigate to history', 'View messages', 'Confirm records visible'],
  'configure': ['Open caregiver dashboard', 'Review options', 'Save configuration'],
};

export function planVirtualUserJourneys(input: {
  goals: readonly VirtualUserGoal[];
  personas: readonly VirtualUserPersona[];
}): VirtualUserJourney[] {
  return input.goals.map((goal) => {
    journeyCounter += 1;
    const persona = input.personas.find((p) => p.userId === goal.userId);
    const templateKey = Object.keys(JOURNEY_TEMPLATES).find((k) => goal.description.toLowerCase().includes(k));
    let steps = templateKey ? [...JOURNEY_TEMPLATES[templateKey]!] : ['Open app', `Attempt ${goal.description}`, 'Verify completion'];

    if (
      /add expense/i.test(goal.description) &&
      (persona?.workflowPriority.some((w) => /create expense/i.test(w)) ?? false)
    ) {
      steps = [
        'Open app',
        'Create expense',
        'Notice typo in amount',
        'Edit expense',
        'View updated list',
        'Open reports',
        'Export report',
        'Confirm export available',
      ];
    }

    const maxSteps = persona?.attentionBudget ?? DEFAULT_JOURNEY_STEP_BUDGET;

    return {
      readOnly: true,
      journeyId: `journey-${journeyCounter}`,
      userId: goal.userId,
      goalId: goal.goalId,
      steps,
      decisionPoints: steps.filter((s) => /notice|confirm|select/i.test(s)),
      expectedUiStates: goal.completionCriteria.map((c) => `UI: ${c}`),
      expectedDataStates: [`Data supports ${goal.description}`],
      expectedServiceEffects: [`Service completes ${goal.description}`],
      accessibilityExpectations: persona?.accessibilityRequirements ?? [],
      maximumStepBudget: maxSteps,
      maximumTimeBudgetMs: DEFAULT_JOURNEY_TIME_BUDGET_MS,
      recoveryRules: ['Retry once on recoverable error', 'Abort on accessibility blocker'],
      completionCriteria: goal.completionCriteria,
    };
  });
}
