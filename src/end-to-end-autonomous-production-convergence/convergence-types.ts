/**
 * AiDevEngine V4 End-to-End Autonomous Production Convergence V1 — types.
 * Not a new authority: ledger + capability-convergence classifications only.
 */

export const E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_V1_PASS_TOKEN =
  'AIDEVENGINE_END_TO_END_AUTONOMOUS_PRODUCTION_CONVERGENCE_V1_PASS' as const;

export const E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION = '1.0.0' as const;

export type CapabilityConvergenceOutcome =
  | 'REUSE_EXISTING_CAPABILITY'
  | 'REPAIR_EXISTING_CAPABILITY'
  | 'COMPLETE_PARTIAL_CAPABILITY'
  | 'GENERATE_NEW_UNIVERSAL_CAPABILITY'
  | 'GENERATE_NEW_UNIVERSAL_CAPABILITY_PACK'
  | 'REGISTER_EXISTING_PROVIDER'
  | 'CREATE_LOCAL_REFERENCE_PROVIDER'
  | 'REQUIRE_APPROVED_CONFIGURATION'
  | 'REQUIRE_EXTERNAL_PROVIDER'
  | 'REQUIRE_HUMAN_ARCHITECTURAL_DECISION'
  | 'FORBIDDEN_OR_UNSAFE';

export type ConvergenceRootCauseClass =
  | 'MISSING_ENGINE_WIRING'
  | 'MISSING_GENERATOR_IMPLEMENTATION'
  | 'MISSING_CAPABILITY_IMPLEMENTATION'
  | 'MISSING_CAPABILITY_PACK'
  | 'INVALID_TRANSFORMATION'
  | 'IDENTITY_DRIFT'
  | 'PRODUCT_FAITHFULNESS_DRIFT'
  | 'COMPOSITION_FAILURE'
  | 'MATERIALIZATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'VERIFICATION_FAILURE'
  | 'READINESS_FAILURE'
  | 'STALE_CONTEXT'
  | 'STATUS_REPORTING_DEFECT'
  | 'CONFIGURATION_REQUIREMENT'
  | 'EXTERNAL_PROVIDER_REQUIREMENT'
  | 'GPCA_GENERATOR_INPUT_BYPASS'
  | 'UNKNOWN';

export interface ConvergenceBuildFixture {
  readonly fixtureId: string;
  readonly label: string;
  readonly prompt: string;
}

export interface ConvergenceAttemptRecord {
  readonly readOnly: true;
  readonly attemptId: string;
  readonly buildId: string | null;
  readonly promptFixtureId: string;
  readonly approvedIdentity: string | null;
  readonly envelopeFingerprint: string | null;
  readonly firstBlockingAuthority: string | null;
  readonly firstBrokenBoundary: string | null;
  readonly diagnosticCode: string | null;
  readonly rootCause: string | null;
  readonly rootCauseClass: ConvergenceRootCauseClass;
  readonly downstreamSymptoms: readonly string[];
  readonly repairEligibility: string | null;
  readonly selectedRepair: string | null;
  readonly capabilityConvergenceOutcome: CapabilityConvergenceOutcome | null;
  readonly filesChanged: readonly string[];
  readonly validatorsRun: readonly string[];
  readonly status: string | null;
  readonly gpcaHardStop: boolean;
  readonly previewAvailable: boolean;
  readonly livePreviewAvailable: boolean;
  readonly npmBuildOk: boolean;
  readonly npmInstallOk: boolean;
  readonly interactionProofResult: string | null;
  readonly b8Result: string | null;
  readonly b9Result: string | null;
  readonly b10Result: string | null;
  readonly b11Result: string | null;
  readonly c1RepairsApplied: number;
  readonly nextBuildResult: string | null;
  readonly sameFailureRecurred: boolean;
  readonly newlyExposedBlocker: string | null;
  readonly finalDisposition: string;
  readonly createdAt: string;
}

export interface ConvergenceLedger {
  readonly readOnly: true;
  readonly version: typeof E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_VERSION;
  readonly attempts: readonly ConvergenceAttemptRecord[];
}

export const CONVERGENCE_BUILD_FIXTURES: readonly ConvergenceBuildFixture[] = [
  {
    fixtureId: 'contact-task-manager',
    label: 'Generic contact and task manager',
    prompt:
      'Build a generic contact and task manager with contacts, categories, notes, tasks, mark complete actions, search, filtering, and local persistence.',
  },
  {
    fixtureId: 'inventory-manager',
    label: 'Inventory manager',
    prompt:
      'Build a generic inventory manager with products, stock records, suppliers, stock adjustments, reorder rules, relationships, calculations, audit history, CSV export, and local persistence.',
  },
  {
    fixtureId: 'appointment-manager',
    label: 'Appointment manager',
    prompt:
      'Build a generic appointment manager with contacts, services, appointments, local availability, workflow states, rescheduling, cancellation, local reminders, search, and filtering.',
  },
  {
    fixtureId: 'restaurant-operations',
    label: 'Restaurant operations manager',
    prompt:
      'Build a Restaurant Management Platform with menu items, categories, tables, orders, order status workflow, staff, customers, inventory, notes, and local reporting.',
  },
  {
    fixtureId: 'mixed-custom',
    label: 'Mixed custom application',
    prompt:
      'Build a volunteer coordination workspace with volunteer profiles, shift signups, assignment actions, skill tags, attendance notes, and local export.',
  },
];
