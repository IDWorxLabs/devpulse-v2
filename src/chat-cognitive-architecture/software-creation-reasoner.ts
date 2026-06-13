/**
 * Phase 25.37 — Software creation reasoning beyond templates.
 */

import type { ChatCognitiveIntent } from './chat-cognitive-types.js';
import type { ChatProjectRealityContext } from './chat-cognitive-types.js';

export interface SoftwareCreationReasoning {
  readOnly: true;
  ideaSummary: string;
  known: string[];
  missing: string[];
  risks: string[];
  architectureDirection: string[];
  nextAction: string;
}

export function reasonAboutSoftwareCreation(
  message: string,
  intent: ChatCognitiveIntent,
  projectContext: ChatProjectRealityContext,
): SoftwareCreationReasoning | null {
  if (intent !== 'SOFTWARE_CREATION' && intent !== 'NEW_PROJECT_REQUEST' && intent !== 'ARCHITECTURE_REVIEW') {
    return null;
  }

  const lower = message.toLowerCase();
  const known: string[] = [];
  const missing: string[] = [];
  const risks: string[] = [];
  const architectureDirection: string[] = [];

  if (/\bcrm\b/i.test(message)) {
    known.push('CRM domain: accounts, contacts, deals, activities, permissions');
    missing.push('Your specific sales workflow, integrations, and data migration needs');
    architectureDirection.push('Start with core entities (Account, Contact, Deal) and role-based access');
  } else if (/\bmobile\b/i.test(message)) {
    known.push('Mobile app request detected');
    missing.push('Target platforms (iOS/Android/web), offline needs, auth provider');
    architectureDirection.push('Define API-first backend + mobile client; plan preview on web first if faster');
  } else if (/\bsaas\b|\bdashboard\b/i.test(message)) {
    known.push('SaaS/dashboard pattern: authenticated users, core workflows, admin views');
    missing.push('Tenant model, billing, onboarding, and primary user jobs-to-be-done');
    architectureDirection.push('Modular monolith or API + SPA; isolate auth, billing, and core domain early');
  } else {
    known.push('General software product request');
    missing.push('Target users, core workflow, success criteria, and constraints');
    architectureDirection.push('Capture requirements → data model → UI flows → API → validation → preview');
  }

  if (/\bauth\b/i.test(lower)) missing.push('Auth method details if not specified (email, SSO, roles)');
  if (/\bapi\b/i.test(lower)) architectureDirection.push('Define API contracts before UI polish');
  if (projectContext.evidenceGaps.length) {
    risks.push(`Project evidence gaps: ${projectContext.evidenceGaps.slice(0, 2).join('; ')}`);
  }
  risks.push('Scope creep if requirements are not captured before build');
  risks.push('Launch claims before Founder Test and verification — stay bounded');

  return {
    readOnly: true,
    ideaSummary: message.trim().slice(0, 200),
    known,
    missing,
    risks,
    architectureDirection,
    nextAction:
      missing.length > 0
        ? `Answer the highest-impact unknown first: ${missing[0]}. Then run Founder Test after a preview/verification slice exists.`
        : 'Draft a one-page requirements outline, then plan architecture and verification before claiming build progress.',
  };
}
