/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — scenarios with CQI-pattern clarification answers.
 */

import { MULTI_DOMAIN_PROOF_SCENARIOS } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-registry.js';
import type { MultiDomainScenarioDefinition } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-types.js';
import { SCENARIO_CQI_CLARIFICATIONS } from './cqi-pattern-clarification-builder.js';

export const MULTI_DOMAIN_PROOF_SCENARIOS_V1_1: readonly MultiDomainScenarioDefinition[] =
  MULTI_DOMAIN_PROOF_SCENARIOS.map((scenario) => {
    const baseAnswers =
      SCENARIO_CQI_CLARIFICATIONS[scenario.id] ?? scenario.clarificationAnswers;
    const crmDomainExtras =
      scenario.id === 'crm-lite' ||
      scenario.id === 'booking-system' ||
      scenario.id === 'client-portal'
        ? [
            'Lead management: No separate lead management pipeline — contact follow-up workflow process only for MVP.',
            'Sales pipeline: No sales pipeline stages beyond follow-up status tracking for MVP scope.',
          ]
        : [];
    return {
      ...scenario,
      clarificationAnswers: [...baseAnswers, ...crmDomainExtras],
    };
  });

export { buildScenarioEnrichedPrompt } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-registry.js';
