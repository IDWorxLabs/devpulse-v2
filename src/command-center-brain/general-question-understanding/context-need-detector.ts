/**
 * Determine context needs from dimensions and question signals.
 */

import type { ContextNeed, QuestionDimension } from './general-question-types.js';

const DIMENSION_CONTEXT_MAP: Partial<Record<QuestionDimension, ContextNeed[]>> = {
  PROJECT: ['PROJECT_PROFILE', 'PROJECT_FACTS', 'RISK_FACTS', 'MISSING_CAPABILITIES', 'BLOCKERS'],
  SYSTEM: ['OWNERSHIP_REGISTRY', 'RUNTIME_STATUS'],
  ROADMAP: ['ROADMAP_STATE', 'PROJECT_FACTS', 'TIMELINE_STATE'],
  RISK: ['RISK_FACTS', 'MISSING_CAPABILITIES', 'BLOCKERS'],
  DEPENDENCY: ['CROSS_SYSTEM_RELATIONSHIPS', 'PROJECT_FACTS'],
  IMPACT: ['CROSS_SYSTEM_RELATIONSHIPS', 'PROJECT_FACTS'],
  MEMORY: ['SHARED_MEMORY'],
  ARCHITECTURE: ['PROJECT_FACTS', 'OWNERSHIP_REGISTRY', 'CROSS_SYSTEM_RELATIONSHIPS'],
  PLANNING: ['PROJECT_FACTS', 'ROADMAP_STATE', 'RISK_FACTS', 'MISSING_CAPABILITIES'],
  DEVELOPMENT: ['DEVELOPMENT_KNOWLEDGE', 'PROJECT_FACTS'],
  DEBUGGING: ['DEBUG_CONTEXT', 'PROJECT_FACTS'],
  EXECUTION: ['RUNTIME_STATUS', 'PROJECT_FACTS', 'ROADMAP_STATE', 'EXECUTION_RUNTIME_FACTS'],
};

const QUESTION_CONTEXT_SIGNALS: Array<[readonly string[], ContextNeed]> = [
  [['weakness', 'weak at', 'strong at', 'holding back'], 'RISK_FACTS'],
  [['missing capability', 'gap', 'not built yet'], 'MISSING_CAPABILITIES'],
  [['blocker', 'holding back'], 'BLOCKERS'],
  [['execution not connected', 'runtime', 'not connected'], 'RUNTIME_STATUS'],
  [['remember', 'recall', 'last time'], 'SHARED_MEMORY'],
  [['depend', 'dependency', 'upstream', 'downstream', 'what breaks if', 'missing dependency'], 'DEPENDENCY_FACTS'],
  [['depend', 'dependency', 'relationship', 'connected to'], 'CROSS_SYSTEM_RELATIONSHIPS'],
  [['roadmap', 'phase', 'cloud runtime'], 'ROADMAP_STATE'],
  [['timeline', 'came before', 'most recently', 'milestone'], 'TIMELINE_STATE'],
  [['debug', 'bug', 'error'], 'DEBUG_CONTEXT'],
  [['implement', 'code', 'refactor'], 'DEVELOPMENT_KNOWLEDGE'],
  [['project vault', 'saved project', 'stored project', 'vault facts', 'from vault'], 'VAULT_FACTS'],
  [['workspace', 'active workspace', 'active project', 'workspace boundary', 'workspace mismatch', 'context leakage'], 'WORKSPACE_FACTS'],
  [['history', 'evolution', 'checkpoint', 'rollback', 'restored', 'milestone', 'introduced', 'evolved', 'what changed recently', 'what changed during'], 'HISTORY_FACTS'],
  [['summary', 'summarize', 'overview', 'executive summary', 'technical summary', 'founder summary', 'onboarding', 'project health'], 'SUMMARIZATION_FACTS'],
  [['portfolio', 'what projects exist', 'healthiest project', 'riskiest project', 'compare project', 'active projects', 'portfolio summary', 'projects need attention'], 'PORTFOLIO_FACTS'],
  [['recommended action', 'blocked action', 'deferred action', 'what should we do', 'what is recommended', 'next action', 'action comes from', 'highest priority action'], 'ACTION_VISIBILITY_FACTS'],
  [['why recommended', 'why blocked', 'why deferred', 'why confidence', 'what evidence', 'systems contributed', 'risks were considered', 'blockers were considered', 'reasoning'], 'REASONING_VISIBILITY_FACTS'],
  [['how far', 'percentage complete', 'what remains', 'what is blocked', 'next milestone', 'furthest along', 'behind schedule', 'progress', 'completion', 'remaining'], 'PROGRESS_INTELLIGENCE_FACTS'],
  [['what failed', 'failures exist', 'most severe failure', 'capabilities are blocked', 'dependency chains are impacted', 'failure', 'failed', 'error', 'problem', 'issue', 'severity', 'impact'], 'FAILURE_VISIBILITY_FACTS'],
  [['what did we learn', 'recurring blockers', 'recurring failures', 'recurring recommendations', 'what should we remember', 'what should improve', 'learned', 'learning', 'patterns', 'recurring', 'remember', 'improve', 'observed', 'lessons'], 'LEARNING_VISIBILITY_FACTS'],
  [['execution readiness', 'is execution allowed', 'can we execute', 'execution blocked', 'execution blockers', 'execution status', 'approval would be required', 'capabilities must exist first', 'readiness evaluation', 'execution foundation'], 'EXECUTION_RUNTIME_FACTS'],
  [['build task', 'task plan', 'plan the build', 'what steps would', 'how would you build', 'build sequence', 'implementation plan', 'safety gates are required', 'verification would prove', 'blocking this task'], 'BUILD_TASK_RUNTIME_FACTS'],
  [['code generation', 'generate code', 'what code would be generated', 'what files would change', 'what changes are proposed', 'code artifact', 'implementation proposal', 'blocking code generation'], 'CODE_GENERATION_RUNTIME_FACTS'],
  [['test plan', 'testing runtime', 'how would we test', 'how would you test', 'what tests are required', 'pass fail criteria', 'pass or fail', 'test evidence', 'validation evidence', 'simulated test result', 'simulated failures', 'what would prove', 'what evidence is required', 'can testing run', 'blocking testing', 'count as pass', 'count as fail', 'prove this works'], 'TESTING_RUNTIME_FACTS'],
  [['auto fix', 'auto-fix', 'recommended fix', 'how would you fix', 'how would we fix', 'repair plan', 'rollback plan', 'alternative fixes', 'alternatives exist', 'what alternatives', 'fix proposal', 'what fix is recommended', 'what rollback', 'can auto-fix run', 'can auto fix run', 'blocking auto-fix', 'blocking auto fix', 'prove the fix'], 'AUTO_FIX_RUNTIME_FACTS'],
  [['runtime verification', 'verification report', 'verification score', 'verification evidence', 'verification gaps', 'trust assessment', 'runtime chain verified', 'what verification exists', 'how trustworthy is the runtime', 'what prevents verification', 'what should be verified next', 'build plan valid', 'testing plan valid'], 'RUNTIME_VERIFICATION_FACTS'],
  [['world 2 execution', 'activate world 2', 'world2 execution', 'world 2 activation', 'world2 activation', 'can world 2 build', 'can world 2 execution', 'world 2 runtime', 'world 2 workspace', 'world 2 isolated execution', 'world2 isolated', 'world 1 protected', 'is world 2 isolated', 'gates are required for world 2', 'blocks world 2 activation', 'what blocks world 2', 'what approval is required', 'what runtime chain would world 2'], 'WORLD2_EXECUTION_ACTIVATION_FACTS'],
  [['builder packet execute', 'can this builder packet execute', 'prepare builder packet execution', 'why is this builder packet blocked', 'what approvals are needed before world 2 builds', 'show world 2 execution packet', 'builder packet execution', 'world 2 execution packet', 'packet readiness', 'builder packet approval', 'world 2 build preparation'], 'WORLD2_BUILDER_PACKET_EXECUTION_FACTS'],
  [['can this apply', 'why is apply blocked', 'what approvals are required', 'show apply plan', 'what would world 2 need before apply', 'controlled apply', 'apply plan', 'world 2 apply', 'apply readiness', 'apply approval', 'future apply'], 'WORLD2_CONTROLLED_APPLY_RUNTIME_FACTS'],
  [['can world 2 roll back', 'show rollback plan', 'what rollback safety is required', 'why is rollback blocked', 'what snapshots are required before apply', 'can this change be reversed', 'rollback runtime', 'world 2 rollback', 'rollback plan', 'rollback safety', 'snapshot requirement', 'change reversal'], 'WORLD2_ROLLBACK_RUNTIME_FACTS'],
  [['what happens if apply fails', 'what happens if verification fails', 'what happens if rollback fails', 'show recovery plan', 'why is recovery blocked', 'what recovery strategy is required', 'should this escalate to self-evolution', 'what happens after 3 failed attempts', 'recovery runtime', 'world 2 recovery', 'recovery plan', 'failure recovery', 'recovery strategy', 'self evolution escalation', 'three failure rule'], 'WORLD2_RECOVERY_RUNTIME_FACTS'],
  [['what defines completion', 'how do we know this project is done', 'show completion plan', 'what evidence is missing', 'why is completion blocked', 'what verification is still required', 'completion runtime', 'world 2 completion', 'completion plan', 'completion criteria', 'completion evidence', 'project done', 'verification required', 'what does success look like', 'how do we know the project is complete', 'what evidence proves completion', 'what conditions block completion'], 'WORLD2_COMPLETION_RUNTIME_FACTS'],
  [['request verification', 'verification entry', 'unified verification', 'verification request', 'verification session', 'verification state', 'verification history', 'verification response', 'what should be verified', 'who requested verification', 'verification scope', 'verification authority', 'verification complete', 'verification blocked', 'why is verification blocked'], 'UNIFIED_VERIFICATION_ENTRY_FACTS'],
  [['cloud runtime inventory', 'cloud runtime state', 'cloud runtime lifecycle', 'cloud runtime session', 'cloud runtime ownership', 'cloud runtime history', 'register cloud runtime', 'list cloud runtimes', 'list runtime sessions', 'runtime inventory', 'cloud runtime foundation', 'cloud runtime diagnostics', 'can runtime be resumed', 'cloud runtime authority', 'runtime lifecycle', 'runtime ownership', 'runtime sessions', 'cloud runtime ready', 'cloud runtime blocked', 'cloud runtime archived'], 'CLOUD_RUNTIME_FOUNDATION_FACTS'],
  [['workspace hosting', 'hosted workspace', 'hosted workspaces', 'workspace inventory', 'workspace lifecycle', 'workspace state', 'workspace session', 'workspace ownership', 'workspace isolation', 'workspace runtime link', 'register hosted workspace', 'list hosted workspaces', 'list workspace sessions', 'workspace hosting foundation', 'workspace diagnostics', 'can workspace be resumed', 'can workspace be isolated', 'workspace hosting authority', 'workspace linked to runtime', 'workspace ready', 'workspace blocked', 'workspace archived'], 'WORKSPACE_HOSTING_FOUNDATION_FACTS'],
  [['persistent build', 'persistent builds', 'persistent build session', 'persistent build runtime', 'build session state', 'build progress', 'build context', 'build resume', 'can build be paused', 'can build be resumed', 'long running build', 'register persistent build', 'list persistent builds', 'build runtime link', 'build workspace link', 'persistent build foundation', 'build diagnostics', 'build ownership', 'build lifecycle', 'build history', 'waiting for approval', 'waiting for verification', 'waiting for recovery'], 'PERSISTENT_BUILD_RUNTIME_FOUNDATION_FACTS'],
  [['cloud verification', 'cloud verification request', 'cloud verification requests', 'cloud verification session', 'cloud verification state', 'cloud verification scope', 'cloud verification context', 'cloud verification evidence', 'cloud verification report', 'cloud verification foundation', 'cloud verification inventory', 'register cloud verification', 'list cloud verifications', 'verification runtime link', 'verification workspace link', 'verification build link', 'verification diagnostics', 'verification ownership', 'verification lifecycle', 'verification history', 'waiting for runtime', 'waiting for workspace', 'waiting for build', 'unified entry link'], 'CLOUD_VERIFICATION_FOUNDATION_FACTS'],
  [['cloud recovery', 'cloud recovery candidate', 'recovery candidate', 'recovery candidates', 'recovery plan', 'recovery plans', 'recovery session', 'recovery state', 'recovery context', 'recovery foundation', 'recovery inventory', 'register recovery', 'list recoveries', 'recovery runtime link', 'recovery workspace link', 'recovery build link', 'recovery verification link', 'recovery diagnostics', 'recovery ownership', 'recovery lifecycle', 'recovery history', 'failure identified', 'cloud failure', 'recovery ready'], 'CLOUD_RECOVERY_FOUNDATION_FACTS'],
  [['cloud monitoring', 'monitoring health', 'monitoring alert', 'monitoring alerts', 'monitoring session', 'monitoring state', 'monitoring context', 'monitoring foundation', 'monitoring inventory', 'register monitoring', 'list monitoring', 'monitoring runtime link', 'monitoring workspace link', 'monitoring build link', 'monitoring verification link', 'monitoring recovery link', 'monitoring diagnostics', 'monitoring ownership', 'monitoring lifecycle', 'monitoring history', 'health updated', 'alert created', 'alert acknowledged', 'monitoring active', 'what cloud resources are being monitored'], 'CLOUD_MONITORING_FOUNDATION_FACTS'],
  [['mobile command', 'mobile command session', 'mobile command runtime', 'mobile command state', 'mobile command context', 'mobile command permissions', 'mobile action gate', 'mobile cloud link', 'mobile workspace link', 'mobile build link', 'mobile verification link', 'mobile recovery link', 'mobile monitoring link', 'mobile operator feed', 'mobile project vault', 'mobile command foundation', 'mobile command inventory', 'register mobile command', 'list mobile commands', 'mobile command diagnostics', 'mobile command history', 'mobile command lifecycle', 'action allowed from mobile', 'action blocked from mobile', 'desktop recommended', 'founder only action', 'mobile preview allowed', 'mobile preview blocked', 'connected to cloud from mobile'], 'MOBILE_COMMAND_RUNTIME_FOUNDATION_FACTS'],
  [['mobile chat', 'mobile chat session', 'mobile chat runtime', 'mobile chat message', 'mobile chat prompt', 'mobile chat response', 'mobile chat routing', 'mobile chat context', 'mobile chat action gate', 'mobile chat history', 'mobile chat diagnostics', 'mobile chat inventory', 'register mobile chat', 'list mobile chats', 'prompt received', 'response pending', 'response ready', 'giant prompt', 'routed to command', 'mobile chat foundation', 'chat session created', 'mobile chat cloud link', 'context required'], 'MOBILE_CHAT_RUNTIME_FOUNDATION_FACTS'],
  [['mobile preview', 'mobile preview session', 'mobile preview runtime', 'mobile preview link', 'mobile preview eligibility', 'mobile preview safety', 'mobile preview device policy', 'mobile preview desktop recommendation', 'mobile preview state', 'mobile preview context', 'mobile preview history', 'mobile preview diagnostics', 'mobile preview inventory', 'register mobile preview', 'list mobile previews', 'preview link registered', 'preview pending', 'preview ready', 'desktop recommended for preview', 'mobile preview blocked', 'mobile preview allowed', 'mobile preview foundation'], 'MOBILE_PREVIEW_RUNTIME_FOUNDATION_FACTS'],
  [['mobile approval', 'mobile approval session', 'mobile approval runtime', 'mobile approval request', 'mobile approval decision', 'mobile approval state', 'mobile approval context', 'mobile approval governance', 'mobile approval flow link', 'mobile approval history', 'mobile approval diagnostics', 'mobile approval inventory', 'register mobile approval', 'list mobile approvals', 'approval request registered', 'waiting for decision', 'decision recorded', 'approval pending', 'approval approved', 'approval rejected', 'requires more context', 'founder only approval', 'mobile approval foundation'], 'MOBILE_APPROVAL_RUNTIME_FOUNDATION_FACTS'],
  [['what happened in verification', 'what was verified', 'what failed verification', 'what evidence is missing', 'verification reporting', 'verification reports', 'verification trends', 'verification summary', 'verification failures report', 'verification evidence report', 'founder verification report', 'verification report export', 'reporting engine', 'verification report generated', 'verification report blocked', 'why is reporting blocked'], 'VERIFICATION_REPORTING_ENGINE_FACTS'],
  [['what evidence exists', 'who produced evidence', 'what verification generated', 'what system owns evidence', 'can evidence be trusted', 'evidence inventory', 'evidence lineage', 'evidence ownership', 'evidence traceability', 'verification evidence engine', 'evidence engine', 'evidence authority', 'evidence registered', 'evidence validation', 'evidence report', 'evidence blocked', 'why is evidence blocked'], 'VERIFICATION_EVIDENCE_ENGINE_FACTS'],
  [['what should run first', 'what verification is blocked', 'what dependencies are missing', 'what can run in parallel', 'what is waiting', 'what verification plan exists', 'verification orchestrator', 'verification plan', 'execution order', 'parallel verification', 'blocked verification', 'orchestration blocked', 'why is orchestration blocked'], 'VERIFICATION_ORCHESTRATOR_FACTS'],
  [['what can be verified', 'what owns this verification target', 'what dependencies exist', 'what evidence is required', 'what verification requirements exist', 'verification registry', 'verification targets', 'verification dependencies', 'verification requirements', 'verification owners', 'why is verification registry blocked'], 'VERIFICATION_REGISTRY_FACTS'],
  [['what verification providers exist', 'what verification sessions exist', 'what verification runtime exists', 'what verification capabilities exist', 'why is verification blocked', 'uvl runtime', 'unified verification lab', 'verification runtime', 'verification providers', 'verification sessions', 'verification lab runtime'], 'UNIFIED_VERIFICATION_LAB_RUNTIME_FACTS'],
  [['what verification passed', 'what verification failed', 'what visual issues exist', 'what interaction outcomes were verified', 'visual verification', 'verification results', 'verification risks', 'verification ready', 'verification failed', 'layout verification', 'navigation verification', 'loading verification', 'responsive verification'], 'VISUAL_VERIFICATION_ENGINE_FACTS'],
  [['what interactions were tested', 'what buttons were discovered', 'what navigation paths were executed', 'what workflow paths exist', 'what interaction outcomes occurred', 'why is interaction testing blocked', 'interaction testing', 'button testing', 'navigation testing', 'workflow testing', 'interaction results', 'interaction ready', 'interaction blocked', 'form interaction'], 'INTERACTION_TESTING_ENGINE_FACTS'],
  [['what ui structures exist', 'what layout was detected', 'what navigation regions exist', 'what loading states exist', 'what responsive surfaces exist', 'why is inspection blocked', 'ui inspection', 'layout inspection', 'navigation inspection', 'loading inspection', 'responsive inspection', 'inspection ready', 'inspection blocked'], 'UI_INSPECTION_ENGINE_FACTS'],
  [['can self vision observe', 'show self vision session', 'what observation targets exist', 'what capture plan exists', 'why is self vision blocked', 'self vision runtime', 'self vision session', 'observation session', 'observation targets', 'capture plan', 'vision ready', 'self vision blocked'], 'SELF_VISION_RUNTIME_FACTS'],
  [['is this preview ready', 'what preview limitations exist', 'what can devpulse observe', 'what should self vision look at', 'why is preview not ready', 'can this mobile app be previewed', 'what preview capabilities are missing', 'preview intelligence', 'preview readiness', 'preview limitations', 'observation plan', 'self vision preparation'], 'PREVIEW_INTELLIGENCE_FACTS'],
  [['what preview targets exist', 'show preview session', 'can this project be previewed', 'what preview capabilities exist', 'why is preview blocked', 'live preview', 'preview runtime', 'preview session', 'preview target', 'preview ready', 'preview blocked'], 'LIVE_PREVIEW_RUNTIME_FACTS'],
];

export function detectContextNeeds(
  question: string,
  dimensions: QuestionDimension[],
): ContextNeed[] {
  const lower = question.toLowerCase();
  const needs = new Set<ContextNeed>();

  for (const dim of dimensions) {
    const mapped = DIMENSION_CONTEXT_MAP[dim];
    if (mapped) {
      for (const need of mapped) needs.add(need);
    }
  }

  for (const [signals, need] of QUESTION_CONTEXT_SIGNALS) {
    if (signals.some((s) => lower.includes(s))) {
      needs.add(need);
    }
  }

  if (dimensions.includes('PROJECT') && needs.size === 0) {
    needs.add('PROJECT_PROFILE');
    needs.add('PROJECT_FACTS');
  }

  return [...needs];
}

export function needsUnavailableDevelopmentContext(contextNeeds: ContextNeed[]): boolean {
  return contextNeeds.includes('DEVELOPMENT_KNOWLEDGE') || contextNeeds.includes('DEBUG_CONTEXT');
}
