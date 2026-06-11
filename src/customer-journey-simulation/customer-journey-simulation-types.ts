/**
 * Customer Journey Simulation Engine — types.
 */

import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderInteractionSimulationAssessment } from '../founder-interaction-simulation/founder-interaction-simulation-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';

export type CustomerFindingType =
  | 'DISCOVERY_FAILURE'
  | 'ONBOARDING_FAILURE'
  | 'VALUE_REALIZATION_FAILURE'
  | 'CUSTOMER_TRUST_FAILURE'
  | 'RETENTION_RISK'
  | 'ADVOCACY_FAILURE'
  | 'ADOPTION_BLOCKER';

export type CustomerJourneyCategory =
  | 'DISCOVERY'
  | 'ONBOARDING'
  | 'VALUE'
  | 'TRUST'
  | 'RETENTION'
  | 'ADVOCACY';

export type CustomerPersonaId =
  | 'new-customer'
  | 'returning-customer'
  | 'skeptical-customer'
  | 'paying-customer'
  | 'power-user';

export type CustomerSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface CustomerJourneySubscores {
  discovery: number;
  onboarding: number;
  value: number;
  trust: number;
  retention: number;
  advocacy: number;
}

export interface CustomerJourneyFinding {
  id: string;
  type: CustomerFindingType;
  category: CustomerJourneyCategory;
  severity: CustomerSeverity;
  persona?: CustomerPersonaId;
  whatFails: string;
  customerQuestion: string;
  expectedExperience: string;
  observedGap: string;
  whyItMatters: string;
  recommendedFix: string;
}

export interface CustomerPersonaResult {
  personaId: CustomerPersonaId;
  name: string;
  passed: boolean;
  detail: string;
}

export interface CustomerJourneyScenarioResult {
  id: string;
  category: CustomerJourneyCategory;
  name: string;
  passed: boolean;
  detail: string;
}

export interface CustomerJourneyFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface CustomerJourneySimulationAssessment {
  customerJourneyScore: number;
  subscores: CustomerJourneySubscores;
  personas: CustomerPersonaResult[];
  scenarios: CustomerJourneyScenarioResult[];
  findings: CustomerJourneyFinding[];
  adoptionBlockers: CustomerJourneyFinding[];
  strengths: string[];
  weaknesses: string[];
  topAdoptionBlocker: string | null;
  operatorFeedEvents: CustomerJourneyFeedEvent[];
  customerReady: boolean;
  notReadyForCustomers: boolean;
  findingsGenerated: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface CustomerJourneyShellSources {
  appJs: string;
  html: string;
  css?: string;
}

export interface AssessCustomerJourneySimulationInput {
  shellSources: CustomerJourneyShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  founderInteractionSimulation: FounderInteractionSimulationAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  projectMemoryScore: number;
  previewValidationReady: boolean;
  autonomousBuilderConnected: boolean;
}

export interface EnrichedCustomerJourneyAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface CustomerJourneySimulationVisibility {
  score: number;
  customerJourneyScore: number;
  customerReady: boolean;
  notReadyForCustomers: boolean;
  discoveryPass: boolean;
  onboardingPass: boolean;
  valuePass: boolean;
  trustPass: boolean;
  retentionPass: boolean;
  advocacyPass: boolean;
  adoptionBlockerCount: number;
  personaPassCount: number;
}
