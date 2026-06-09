/**
 * Verification target classifier — maps inspection and interaction reports to verification targets.
 */

import type { InteractionTestingReport } from '../interaction-testing-engine/types.js';
import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { VerificationTarget, VerificationTargetType } from './types.js';

let targetCounter = 0;

export function resetVerificationTargetCounterForTests(): void {
  targetCounter = 0;
}

function nextTargetId(): string {
  targetCounter += 1;
  return `vtarget-${targetCounter.toString().padStart(3, '0')}`;
}

function addTarget(
  targets: VerificationTarget[],
  targetType: VerificationTargetType,
  targetName: string,
  description: string,
): void {
  targets.push({
    targetId: nextTargetId(),
    targetType,
    targetName,
    description,
    verificationOnly: true,
  });
}

export function classifyVerificationTargets(
  inspectionReport: UiInspectionReport | null,
  interactionReport: InteractionTestingReport | null,
): VerificationTarget[] {
  const targets: VerificationTarget[] = [];

  if (inspectionReport) {
    for (const layout of inspectionReport.layoutStructures) {
      addTarget(
        targets,
        'LAYOUT_TARGET',
        layout.structureId,
        `Layout regions: ${layout.layoutRegions.join(', ') || 'none identified'}`,
      );
    }

    for (const nav of inspectionReport.navigationStructures) {
      addTarget(
        targets,
        'NAVIGATION_TARGET',
        nav.structureId,
        `Navigation areas: ${nav.navigationAreas.join(', ') || 'none identified'}`,
      );
    }

    for (const loading of inspectionReport.loadingStructures) {
      addTarget(
        targets,
        'LOADING_TARGET',
        loading.structureId,
        `Loading indicators: ${loading.loadingIndicators.join(', ') || 'none identified'}`,
      );
      if (loading.errorStates.length > 0) {
        addTarget(
          targets,
          'ERROR_STATE_TARGET',
          `${loading.structureId}-errors`,
          `Error states: ${loading.errorStates.join(', ')}`,
        );
      }
    }

    for (const responsive of inspectionReport.responsiveStructures) {
      addTarget(
        targets,
        'RESPONSIVE_TARGET',
        responsive.structureId,
        `Responsive containers: ${responsive.responsiveContainers.join(', ') || 'none identified'}`,
      );
    }
  }

  if (interactionReport) {
    for (const result of interactionReport.interactionResults.slice(0, 8)) {
      addTarget(
        targets,
        'INTERACTION_TARGET',
        result.interactionId,
        `Interaction outcome: ${result.target} — ${result.observedOutcome}`,
      );
    }
  }

  return targets;
}
