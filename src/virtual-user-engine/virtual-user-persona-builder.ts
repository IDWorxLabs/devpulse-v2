/**
 * Virtual User Engine — executable persona construction.
 */

import type { VirtualUserPersona, VirtualUserProfile } from './virtual-user-types.js';

let personaCounter = 0;

export function buildVirtualUserPersonas(profiles: readonly VirtualUserProfile[]): VirtualUserPersona[] {
  return profiles.map((profile) => {
    personaCounter += 1;
    const isPatient = /locked-in|patient/i.test(profile.role);
    const isOwner = /business owner/i.test(profile.role);
    const isCaregiver = /caregiver/i.test(profile.role);

    return {
      readOnly: true,
      personaId: `persona-${personaCounter}`,
      userId: profile.userId,
      abilities: isPatient
        ? ['Blink-based input', 'Gaze selection', 'Emergency phrase access']
        : isOwner
          ? ['Form entry', 'Report viewing', 'Export actions']
          : isCaregiver
            ? ['Settings configuration', 'History review']
            : ['Standard navigation'],
      limitations: isPatient
        ? ['Cannot use normal typing', 'High fatigue risk', 'Cannot recover from confusing UI']
        : isOwner
          ? ['Limited time', 'May make entry mistakes']
          : profile.constraints,
      preferences: isPatient
        ? ['Minimal interaction steps', 'Clear confirmation', 'Large visible targets']
        : isOwner
          ? ['Quick entry', 'Clear totals', 'Easy correction']
          : ['Clear labels'],
      requiredInputModes: isPatient
        ? ['BLINK', 'GAZE', 'ACCESSIBLE_TAP']
        : ['CLICK', 'KEYBOARD'],
      attentionBudget: isPatient ? 5 : isOwner ? 8 : 10,
      errorTolerance: isPatient ? 'LOW' : 'MEDIUM',
      accessibilityRequirements: profile.accessibilityNeeds,
      deviceAssumptions: [profile.deviceContext],
      workflowPriority: profile.primaryWorkflows,
      completionThresholds: profile.successCriteria,
    };
  });
}
