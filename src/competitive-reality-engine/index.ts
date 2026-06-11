export {
  COMPETITIVE_REALITY_ENGINE_PASS_TOKEN,
  COMPETITIVE_REALITY_ENGINE_OWNER_MODULE,
  MAX_COMPETITIVE_FINDINGS,
  MAX_COMPETITIVE_ADVANTAGES,
  MAX_COMPETITIVE_CLAIMS,
  MAX_COMPETITIVE_ACTIONS,
} from './competitive-reality-engine-bounds.js';

export type {
  AssessCompetitiveRealityInput,
  CompetitiveAdvantageRecord,
  CompetitiveCategory,
  CompetitiveClaimRecord,
  CompetitiveClaimStatus,
  CompetitiveFeedEvent,
  CompetitiveFinding,
  CompetitiveFindingSeverity,
  CompetitiveFindingType,
  CompetitivePositionClassification,
  CompetitiveRealityAssessment,
  CompetitiveRealityVisibility,
  CompetitiveShellSources,
  CompetitiveSubscores,
  EnrichedCompetitiveAssessments,
} from './competitive-reality-engine-types.js';

export {
  assessCompetitiveReality,
  enrichAssessmentsWithCompetitiveReality,
  evaluateCompetitiveRealityVisibility,
  resetCompetitiveRealityCounterForTests,
} from './competitive-reality-engine-authority.js';
