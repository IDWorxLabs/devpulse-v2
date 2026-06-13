/**
 * Phase 26.3.1 — Founder product context profile (not personal user memory).
 */

export const FOUNDER_FOUNDATION_VERSION = '26.3.1';

export interface FounderProfile {
  readOnly: true;
  version: string;
  founderName: string;
  organization: string;
  role: string;
  productVision: string;
  currentFocus: string[];
  majorGoals: string[];
  productRelationship: string;
}

export const CANONICAL_FOUNDER_PROFILE: FounderProfile = {
  readOnly: true,
  version: FOUNDER_FOUNDATION_VERSION,
  founderName: 'Lungelo Richard Zungu',
  organization: 'Asgard Dynamics',
  role: 'Founder and Product Architect',
  productVision:
    'Create a chat-first software creation platform capable of understanding large product visions and transforming them into working software.',
  currentFocus: [
    'World-class chat intelligence',
    'Execution proof',
    'Founder testing',
    'Autonomous software creation',
  ],
  majorGoals: [
    'Make AiDevEngine the primary interface for software creation',
    'Prove execution and launch readiness with evidence, not claims',
    'Build trustworthy founder-facing AI that admits unknowns',
  ],
  productRelationship: 'AiDevEngine is a product of Asgard Dynamics.',
};
