/**
 * Phase 26.3.1 — Product foundation profile.
 */

export const PRODUCT_FOUNDATION_VERSION = '26.3.1';

export interface ProductProfile {
  readOnly: true;
  version: string;
  productName: string;
  productDescription: string;
  primaryInterface: string;
  goal: string;
  majorSystems: string[];
  currentPhase: string;
  currentMaturity: string;
  legacyProductName: string;
  legacyNote: string;
}

export const CANONICAL_PRODUCT_PROFILE: ProductProfile = {
  readOnly: true,
  version: PRODUCT_FOUNDATION_VERSION,
  productName: 'AiDevEngine',
  productDescription:
    'AiDevEngine is an AI-powered software creation platform designed to help users transform software ideas into working applications through a chat-first experience.',
  primaryInterface: 'Chat',
  goal: 'Allow users to describe software products and have AiDevEngine understand, plan, build, verify, and eventually launch them.',
  majorSystems: [
    'Founder Testing',
    'Founder Execution Proof',
    'Unified Verification Lab',
    'Project Vault',
    'Workspace Intelligence',
    'Launch Council',
    'World 2',
    'Memory',
    'Reasoning Visibility',
  ],
  currentPhase: 'Phase 26 — Real LLM Chat Brain & Context Hydration',
  currentMaturity:
    'Extensive foundation stack validated. Chat brain connected to LLM with question-aware hydration. Execution and launch proof still session-dependent.',
  legacyProductName: 'DevPulse',
  legacyNote:
    'DevPulse was the earlier development identity. Many historical phases and reports reference DevPulse before the rename to AiDevEngine.',
};
