/**
 * Intent Understanding Engine — user persona extraction.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { UserPersona, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

const ROLE_PATTERNS: Array<{ pattern: RegExp; role: string; description: string; goals: string[] }> = [
  {
    pattern: /\bcaregiver/i,
    role: 'Caregiver',
    description: 'Family member or professional providing assistive support',
    goals: ['Monitor communication activity', 'Configure assistive settings', 'Review history'],
  },
  {
    pattern: /\bpatient\b|\blocked[\s-]?in/i,
    role: 'Patient',
    description: 'Primary assistive communication user with limited motor control',
    goals: ['Communicate via eye tracking and blinks', 'Speak composed messages', 'Access emergency speech'],
  },
  {
    pattern: /\badministrator|\badmin\b/i,
    role: 'Administrator',
    description: 'System administrator managing configuration and users',
    goals: ['Manage users and permissions', 'Configure system settings', 'Review audit logs'],
  },
  {
    pattern: /\bbusiness owner|\bowner\b/i,
    role: 'Business Owner',
    description: 'Business stakeholder tracking operations and outcomes',
    goals: ['Track business metrics', 'Manage team workflows', 'Review reports'],
  },
  {
    pattern: /\bdeveloper\b/i,
    role: 'Developer',
    description: 'Technical user integrating or extending the product',
    goals: ['Integrate APIs', 'Configure technical settings', 'Debug issues'],
  },
  {
    pattern: /\benterprise\b/i,
    role: 'Enterprise User',
    description: 'Enterprise employee using organization-scoped features',
    goals: ['Complete assigned workflows', 'Collaborate with team', 'Access enterprise data'],
  },
  {
    pattern: /\bconsumer\b|\bend user/i,
    role: 'Consumer',
    description: 'General end user of the application',
    goals: ['Complete primary tasks', 'Navigate the application', 'Achieve personal goals'],
  },
];

export function extractUserPersonas(rawPrompt: string): UserPersona[] {
  const extraction = extractPromptFeatures(rawPrompt);
  const personas: UserPersona[] = [];
  let personaIndex = 0;

  const addPersona = (
    role: string,
    description: string,
    goals: string[],
    isPrimary: boolean,
    excerpt: string,
  ): void => {
    personaIndex += 1;
    personas.push({
      readOnly: true,
      personaId: `persona-${personaIndex}`,
      role,
      description,
      goals,
      isPrimary,
      evidence: [evidence('prompt_analysis', excerpt)],
    });
  };

  for (const entry of ROLE_PATTERNS) {
    if (entry.pattern.test(rawPrompt)) {
      addPersona(entry.role, entry.description, entry.goals, personas.length === 0, `Detected role: ${entry.role}`);
    }
  }

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    if (!personas.some((p) => p.role === 'Patient')) {
      addPersona(
        'Patient',
        'Locked-in syndrome user requiring assistive communication',
        ['Communicate via gaze and blinks', 'Compose and speak messages', 'Trigger emergency speech'],
        true,
        'LISA assistive communication context',
      );
    }
    if (!personas.some((p) => p.role === 'Caregiver')) {
      addPersona(
        'Caregiver',
        'Caregiver monitoring and configuring assistive communication',
        ['Review communication history', 'Adjust accessibility settings', 'Monitor usage'],
        false,
        'Caregiver dashboard requirement',
      );
    }
  }

  if (!personas.length) {
    for (const user of extraction.targetUsers) {
      addPersona(
        user,
        `Primary ${user} of ${extraction.appName}`,
        [extraction.corePurpose],
        personas.length === 0,
        `Inferred target user: ${user}`,
      );
    }
  }

  if (!personas.length) {
    addPersona(
      'End User',
      'Primary application user',
      [extraction.corePurpose],
      true,
      'Default primary user persona',
    );
  }

  if (!personas.some((p) => p.isPrimary)) {
    personas[0] = { ...personas[0], isPrimary: true };
  }

  return personas;
}
