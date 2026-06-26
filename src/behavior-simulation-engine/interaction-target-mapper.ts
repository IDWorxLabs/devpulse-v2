/**
 * Behavior Simulation Engine — interaction target mapping.
 */

import type { BehaviorScenario, InteractionTarget } from './behavior-simulation-types.js';

let targetCounter = 0;

export function mapInteractionTargets(scenarios: readonly BehaviorScenario[]): InteractionTarget[] {
  return scenarios.flatMap((scenario) => {
    const targets: InteractionTarget[] = [];
    for (const step of scenario.actionSteps) {
      targetCounter += 1;
      const targetType = inferTargetType(step);
      const accessibleName = step.replace(/^(Click|Open|Enter|Navigate to|Select|Trigger|Save|Apply|Confirm)\s+/i, '');
      targets.push({
        readOnly: true,
        targetId: `target-${targetCounter}`,
        targetType,
        accessibleName,
        selectorStrategy: targetType === 'ROUTE' ? 'route' : 'accessible-name',
        selectorValue: accessibleName,
        requiredRole: targetType === 'BUTTON' ? 'button' : targetType === 'INPUT' ? 'textbox' : 'region',
        expectedHandler: `${slugify(scenario.name)}Handler`,
        expectedStateOwner: scenario.featureSliceIds[0] ?? 'core-shell',
        expectedFeatureSliceId: scenario.featureSliceIds[0] ?? 'slice-1',
        traceabilityLinks: [
          ...scenario.sourceRequirementIds,
          ...scenario.featureSliceIds,
          scenario.scenarioId,
        ],
      });
    }
    return targets;
  });
}

function inferTargetType(step: string): InteractionTarget['targetType'] {
  if (/navigate|route/i.test(step)) return 'ROUTE';
  if (/enter|type|input/i.test(step)) return 'INPUT';
  if (/filter|menu/i.test(step)) return 'MENU';
  if (/settings|toggle/i.test(step)) return 'TOGGLE';
  if (/blink|gesture/i.test(step)) return 'GESTURE';
  return 'BUTTON';
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
