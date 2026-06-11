/**
 * Promise Fulfillment Authority — assessment types.
 */

export type PromiseStatus = 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'UNPROVEN' | 'CONTRADICTED';

export type PromiseCategory =
  | 'PRODUCT_PROMISE'
  | 'INTELLIGENCE_PROMISE'
  | 'LAUNCH_PROMISE'
  | 'TRUST_PROMISE'
  | 'BUILDER_PROMISE';

export type PromiseFulfillmentReadinessState = 'FULFILLED' | 'PARTIAL' | 'RISK' | 'BLOCKED';

export type PromiseEvidenceSource =
  | 'FOUNDER_TESTING'
  | 'CHAT_INTELLIGENCE_REALITY'
  | 'REPOSITORY_TYPECHECK_REALITY'
  | 'SKEPTICAL_FOUNDER_SIMULATOR';

export interface RegisteredPromiseDefinition {
  promiseId: string;
  promise: string;
  category: PromiseCategory;
}

export interface PromiseAssessment {
  promiseId: string;
  promise: string;
  category: PromiseCategory;
  status: PromiseStatus;
  confidence: number;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  recommendations: string[];
}

export interface PromiseFulfillmentAssessment {
  readOnly: true;
  fulfillmentScore: number;
  fulfilledCount: number;
  partiallyFulfilledCount: number;
  unprovenCount: number;
  contradictedCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: PromiseFulfillmentReadinessState;
  promiseAssessments: PromiseAssessment[];
  recommendations: string[];
  cacheKey: string;
}
