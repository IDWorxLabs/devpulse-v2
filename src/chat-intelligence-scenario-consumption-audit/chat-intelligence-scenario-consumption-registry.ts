/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption registry (V1).
 */

export const CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS =
  'CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS';

export const CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION =
  'Why does Founder Test report Chat Intelligence Score = 0 when Chat Capability Answer Quality passes at ~97/100?';

export const CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CACHE_KEY_PREFIX =
  'chat-intelligence-scenario-consumption-v1';

export const TESTING_INFRASTRUCTURE_DEFECT = 'TESTING_INFRASTRUCTURE_DEFECT';

export const CHAT_SCENARIO_CONSUMPTION_RULES = [
  'Rule 1 — executed scenario with score cannot appear as 0/0',
  'Rule 2 — average score ≥ 85 must not report Chat Intelligence launch gate as 0',
  'Rule 3 — CHAT_CAPABILITY_ANSWER_QUALITY_PASS must be consumed by Founder Test',
  'Rule 4 — missing scenario count is infrastructure failure not product failure',
  'Rule 5 — registration and execution counts must match unless explicit skip evidence',
] as const;

export const PIPELINE_STAGES = [
  'REGISTRATION',
  'DISCOVERY',
  'SELECTION',
  'EXECUTION',
  'RESULT_CAPTURE',
  'SCORING',
  'PROPAGATION',
  'FOUNDER_TEST_CONSUMPTION',
  'REPORT_RENDER',
] as const;

export const CHAT_SCENARIO_SOURCE_PRIORITY = [
  'CHAT_INTELLIGENCE_REALITY',
  'CHAT_STRESS_SIMULATION',
  'CHAT_CAPABILITY_ANSWER_QUALITY',
] as const;

export const INTEGRATION_TARGETS = [
  'Founder Test Integration',
  'Chat Intelligence Reality',
  'Product Readiness Simulation',
  'Founder Truth Matrix',
  'Founder Test Runtime Monitor',
  'Launch Readiness Reporting',
] as const;
