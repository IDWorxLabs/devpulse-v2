/**

 * Build Materialization Truth Bridge — constants and registry (Phase 26.75).

 */



export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS = 'BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS';

export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_OWNER_MODULE =

  'devpulse_build_materialization_truth_bridge';

export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_PHASE =

  'Phase 26.75 — Build Materialization Truth Bridge V1';

export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE =

  'BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT';

export const BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE =

  'BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT';

export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX =

  'build-materialization-truth-bridge-v1';

export const MAX_BUILD_MATERIALIZATION_TRUTH_BRIDGE_HISTORY = 16;



export const BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION =

  'Did build files actually exist on disk, and did Founder Test incorrectly report missing artifacts?';



export const BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION =

  'BUILD_MATERIALIZATION_TRUTH' as const;



export const EVIDENCE_PRIORITY_ORDER = [

  'Current disk evidence',

  'Workspace evidence',

  'Connected build proof',

  'Historical founder reports',

  'Cached proof snapshots',

] as const;



export const RECONCILIATION_RULES = [

  'Rule 1 — missingArtifacts=0 + existingArtifacts>0 + workspaceExists: ARTIFACTS_NOT_GENERATED cannot be root cause',

  'Rule 2 — BUILD_MATERIALIZATION_PROVEN: Truth Matrix must not classify BUILD as NOT_PROVEN without contradictory evidence',

  'Rule 3 — Filesystem evidence outranks stale proof snapshots',

  'Rule 4 — Files exist but downstream proof cannot see them: EVIDENCE_PROPAGATION_FAILURE not ARTIFACTS_NOT_GENERATED',

] as const;



export const INTEGRATION_TARGET_AUTHORITIES = [

  'build-materialization-reality',

  'connected-build-execution',

  'founder-truth-matrix-integration',

  'founder-test-launch-readiness',

  'autonomous-build-execution-proof',

] as const;



export const ORCHESTRATION_FLOW = [

  'Collect Build Materialization Reality (disk scan)',

  'Collect Connected Build Execution Proof',

  'Collect Autonomous Build Execution Proof BUILD stage',

  'Collect Founder Truth Matrix BUILD verdict (if available)',

  'Apply reconciliation rules 1–4',

  'Derive authoritative BUILD truth verdict',

  'Emit contradictions and recommended fix',

] as const;



export const SAFETY_GUARANTEES = [

  'Read-only — no file mutation',

  'No synthetic evidence generation',

  'Filesystem evidence is authoritative over stale proof snapshots',

  'Founder Test cannot declare artifacts→files broken when disk proves files exist',

  'Single authoritative BUILD truth verdict for Truth Matrix and Launch Readiness',

] as const;



export const FOUNDER_BUILD_TRUTH_QUESTIONS = [

  'Did the files actually exist?',

  'Did Founder Test incorrectly report missing artifacts?',

  'Which authority lost the evidence?',

  'Is BUILD broken?',

  'Or is proof propagation broken?',

  'What exact fix should happen next?',

] as const;


