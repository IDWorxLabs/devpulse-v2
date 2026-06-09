/**
 * Lazy route loader — dynamic imports for heavy foundation handlers.
 */

import { createRequire } from 'node:module';

import { processCrossSystemAwareness } from '../cross-system-awareness/index.js';
import { formatMemoryRecallResponse, recallRelevantMemories } from '../../shared-memory/index.js';
import { answerProjectQuestionWithTrace, processProjectUnderstandingRequest } from '../../project-understanding/index.js';
import { processTimelineIntelligenceRequest } from '../../timeline-intelligence/index.js';
import { processUnifiedDecisionLayerRequest } from '../../unified-decision-layer/index.js';

const require = createRequire(import.meta.url);

export type RouteGroup =
  | 'project-understanding'
  | 'shared-memory'
  | 'timeline'
  | 'cross-system-awareness'
  | 'portfolio-intelligence'
  | 'mobile-approval'
  | 'autonomous-builder'
  | 'mobile-push'
  | 'notification-delivery'
  | 'founder-inbox'
  | 'founder-notification'
  | 'cross-device'
  | 'mobile-preview'
  | 'mobile-chat'
  | 'mobile-command'
  | 'cloud-monitoring'
  | 'cloud-recovery'
  | 'cloud-verification'
  | 'persistent-build'
  | 'workspace-hosting'
  | 'cloud-runtime'
  | 'unified-verification'
  | 'verification-reporting'
  | 'verification-evidence'
  | 'verification-orchestrator'
  | 'verification-registry'
  | 'uvl-runtime'
  | 'visual-verification'
  | 'interaction-testing'
  | 'ui-inspection'
  | 'self-vision'
  | 'preview-intelligence'
  | 'live-preview'
  | 'world2-completion'
  | 'world2-recovery'
  | 'world2-rollback'
  | 'world2-controlled-apply'
  | 'world2-builder-packet'
  | 'world2-execution-activation'
  | 'runtime-verification'
  | 'auto-fix'
  | 'testing-runtime'
  | 'code-generation'
  | 'build-task'
  | 'execution-runtime'
  | 'learning-visibility'
  | 'failure-visibility'
  | 'progress-intelligence'
  | 'reasoning-visibility'
  | 'action-visibility'
  | 'project-summarization'
  | 'project-history'
  | 'workspace-intelligence'
  | 'dependency-intelligence';

export interface RouteHandlerResult {
  responseText: string;
}

export type RouteHandler = (message: string) => RouteHandlerResult;

export const HOT_ROUTE_GROUPS: readonly RouteGroup[] = [
  'project-understanding',
  'shared-memory',
  'timeline',
  'cross-system-awareness',
] as const;

export const LAZY_ROUTE_GROUPS: readonly RouteGroup[] = [
  'portfolio-intelligence',
  'mobile-approval',
  'autonomous-builder',
  'mobile-push',
  'notification-delivery',
  'founder-inbox',
  'founder-notification',
  'cross-device',
  'mobile-preview',
  'mobile-chat',
  'mobile-command',
  'cloud-monitoring',
  'cloud-recovery',
  'cloud-verification',
  'persistent-build',
  'workspace-hosting',
  'cloud-runtime',
  'unified-verification',
  'verification-reporting',
  'verification-evidence',
  'verification-orchestrator',
  'verification-registry',
  'uvl-runtime',
  'visual-verification',
  'interaction-testing',
  'ui-inspection',
  'self-vision',
  'preview-intelligence',
  'live-preview',
  'world2-completion',
  'world2-recovery',
  'world2-rollback',
  'world2-controlled-apply',
  'world2-builder-packet',
  'world2-execution-activation',
  'runtime-verification',
  'auto-fix',
  'testing-runtime',
  'code-generation',
  'build-task',
  'execution-runtime',
  'learning-visibility',
  'failure-visibility',
  'progress-intelligence',
  'reasoning-visibility',
  'action-visibility',
  'project-summarization',
  'project-history',
  'workspace-intelligence',
  'dependency-intelligence',
] as const;

interface RouteSpec {
  modulePath: string;
  exportName: string;
}

const ROUTE_SPECS: Record<RouteGroup, RouteSpec | 'hot'> = {
  'project-understanding': 'hot',
  'shared-memory': 'hot',
  timeline: 'hot',
  'cross-system-awareness': 'hot',
  'portfolio-intelligence': { modulePath: '../../portfolio-intelligence/index.js', exportName: 'processPortfolioIntelligenceRequest' },
  'mobile-approval': { modulePath: '../../mobile-approval-runtime/index.js', exportName: 'processMobileApprovalRequest' },
  'autonomous-builder': { modulePath: '../../autonomous-builder/index.js', exportName: 'processAutonomousBuilderRequest' },
  'mobile-push': { modulePath: '../../mobile-push/index.js', exportName: 'processMobilePushRequest' },
  'notification-delivery': { modulePath: '../../notification-delivery/index.js', exportName: 'processNotificationDeliveryRequest' },
  'founder-inbox': { modulePath: '../../founder-inbox/index.js', exportName: 'processFounderInboxRequest' },
  'founder-notification': { modulePath: '../../founder-notification-runtime/index.js', exportName: 'processFounderNotificationRequest' },
  'cross-device': { modulePath: '../../cross-device-runtime/index.js', exportName: 'processCrossDeviceRequest' },
  'mobile-preview': { modulePath: '../../mobile-preview-runtime/index.js', exportName: 'processMobilePreviewRequest' },
  'mobile-chat': { modulePath: '../../mobile-chat-runtime/index.js', exportName: 'processMobileChatRequest' },
  'mobile-command': { modulePath: '../../mobile-command-runtime/index.js', exportName: 'processMobileCommandRequest' },
  'cloud-monitoring': { modulePath: '../../cloud-monitoring/index.js', exportName: 'processCloudMonitoringRequest' },
  'cloud-recovery': { modulePath: '../../cloud-recovery/index.js', exportName: 'processCloudRecoveryRequest' },
  'cloud-verification': { modulePath: '../../cloud-verification/index.js', exportName: 'processCloudVerificationRequest' },
  'persistent-build': { modulePath: '../../persistent-build-runtime/index.js', exportName: 'processPersistentBuildRequest' },
  'workspace-hosting': { modulePath: '../../workspace-hosting/index.js', exportName: 'processWorkspaceHostingRequest' },
  'cloud-runtime': { modulePath: '../../cloud-runtime/index.js', exportName: 'processCloudRuntimeRequest' },
  'unified-verification': { modulePath: '../../unified-verification-entry/index.js', exportName: 'processUnifiedVerificationRequest' },
  'verification-reporting': { modulePath: '../../verification-reporting-engine/index.js', exportName: 'processVerificationReportingRequest' },
  'verification-evidence': { modulePath: '../../verification-evidence-engine/index.js', exportName: 'processVerificationEvidenceRequest' },
  'verification-orchestrator': { modulePath: '../../verification-orchestrator/index.js', exportName: 'processVerificationOrchestratorRequest' },
  'verification-registry': { modulePath: '../../verification-registry/index.js', exportName: 'processVerificationRegistryRequest' },
  'uvl-runtime': { modulePath: '../../unified-verification-lab/index.js', exportName: 'processVerificationRuntimeRequest' },
  'visual-verification': { modulePath: '../../visual-verification-engine/index.js', exportName: 'processVisualVerificationRequest' },
  'interaction-testing': { modulePath: '../../interaction-testing-engine/index.js', exportName: 'processInteractionTestingRequest' },
  'ui-inspection': { modulePath: '../../ui-inspection-engine/index.js', exportName: 'processUiInspectionRequest' },
  'self-vision': { modulePath: '../../self-vision-runtime/index.js', exportName: 'processSelfVisionRuntimeRequest' },
  'preview-intelligence': { modulePath: '../../preview-intelligence/index.js', exportName: 'processPreviewIntelligenceRequest' },
  'live-preview': { modulePath: '../../live-preview-runtime/index.js', exportName: 'processLivePreviewRequest' },
  'world2-completion': { modulePath: '../../world2-completion-runtime/index.js', exportName: 'processCompletionRequest' },
  'world2-recovery': { modulePath: '../../world2-recovery-runtime/index.js', exportName: 'processRecoveryRequest' },
  'world2-rollback': { modulePath: '../../world2-rollback-runtime/index.js', exportName: 'processRollbackRequest' },
  'world2-controlled-apply': { modulePath: '../../world2-controlled-apply-runtime/index.js', exportName: 'processControlledApplyRequest' },
  'world2-builder-packet': { modulePath: '../../world2-builder-packet-execution/index.js', exportName: 'processBuilderPacketExecutionRequest' },
  'world2-execution-activation': { modulePath: '../../world2-execution-activation/index.js', exportName: 'processWorld2ExecutionActivationRequest' },
  'runtime-verification': { modulePath: '../../runtime-verification-layer/index.js', exportName: 'processRuntimeVerificationRequest' },
  'auto-fix': { modulePath: '../../auto-fix-runtime/index.js', exportName: 'processAutoFixRuntimeRequest' },
  'testing-runtime': { modulePath: '../../testing-runtime/index.js', exportName: 'processTestingRuntimeRequest' },
  'code-generation': { modulePath: '../../code-generation-runtime/index.js', exportName: 'processCodeGenerationRuntimeRequest' },
  'build-task': { modulePath: '../../build-task-runtime/index.js', exportName: 'processBuildTaskRuntimeRequest' },
  'execution-runtime': { modulePath: '../../execution-runtime/index.js', exportName: 'processExecutionRuntimeRequest' },
  'learning-visibility': { modulePath: '../../learning-visibility-engine/index.js', exportName: 'processLearningVisibilityRequest' },
  'failure-visibility': { modulePath: '../../failure-visibility-engine/index.js', exportName: 'processFailureVisibilityRequest' },
  'progress-intelligence': { modulePath: '../../progress-intelligence/index.js', exportName: 'processProgressIntelligenceRequest' },
  'reasoning-visibility': { modulePath: '../../reasoning-visibility-engine/index.js', exportName: 'processReasoningVisibilityRequest' },
  'action-visibility': { modulePath: '../../action-visibility-engine/index.js', exportName: 'processActionVisibilityRequest' },
  'project-summarization': { modulePath: '../../project-summarization-engine/index.js', exportName: 'processProjectSummarizationRequest' },
  'project-history': { modulePath: '../../project-history-intelligence/index.js', exportName: 'processProjectHistoryIntelligenceRequest' },
  'workspace-intelligence': { modulePath: '../../workspace-intelligence/index.js', exportName: 'processWorkspaceIntelligenceRequest' },
  'dependency-intelligence': { modulePath: '../../dependency-intelligence/index.js', exportName: 'processDependencyIntelligenceRequest' },
};

const handlerCache = new Map<RouteGroup, RouteHandler>();
let loadCount = 0;
let asyncLoadCount = 0;
let mismatchCount = 0;

function normalizeHandlerResult(raw: unknown, group: RouteGroup): RouteHandlerResult {
  if (typeof raw === 'object' && raw !== null && 'responseText' in raw) {
    const text = (raw as { responseText?: string }).responseText;
    if (typeof text === 'string') return { responseText: text };
  }
  if (typeof raw === 'object' && raw !== null && 'response' in raw) {
    const nested = (raw as { response?: { responseText?: string } }).response;
    if (nested && typeof nested.responseText === 'string') return { responseText: nested.responseText };
  }
  mismatchCount += 1;
  return { responseText: `[${group}] handler returned unexpected shape` };
}

function getHotHandler(group: RouteGroup): RouteHandler {
  switch (group) {
    case 'project-understanding':
      return (message: string) => {
        answerProjectQuestionWithTrace(message);
        processProjectUnderstandingRequest(message);
        return { responseText: '' };
      };
    case 'shared-memory':
      return (message: string) => ({ responseText: formatMemoryRecallResponse(message, recallRelevantMemories(message)) });
    case 'timeline':
      return (message: string) => processTimelineIntelligenceRequest(message);
    case 'cross-system-awareness':
      return (message: string) => processCrossSystemAwareness(message, 'RELATIONSHIP');
    default:
      throw new Error(`Not a hot route group: ${group}`);
  }
}

function resolveLazyHandlerSync(group: RouteGroup): RouteHandler {
  const cached = handlerCache.get(group);
  if (cached) return cached;

  const spec = ROUTE_SPECS[group];
  if (spec === 'hot') return getHotHandler(group);

  const mod = require(spec.modulePath) as Record<string, unknown>;
  const fn = mod[spec.exportName];
  if (typeof fn !== 'function') {
    throw new Error(`Missing export ${spec.exportName} for route group ${group}`);
  }
  const handler = (message: string) => normalizeHandlerResult((fn as (m: string) => unknown)(message), group);
  handlerCache.set(group, handler);
  loadCount += 1;
  return handler;
}

export function getRouteHandlerSync(group: RouteGroup): RouteHandler {
  if (HOT_ROUTE_GROUPS.includes(group)) return getHotHandler(group);
  return resolveLazyHandlerSync(group);
}

export async function loadRouteHandler(group: RouteGroup): Promise<RouteHandler> {
  if (HOT_ROUTE_GROUPS.includes(group)) return getHotHandler(group);
  const cached = handlerCache.get(group);
  if (cached) return cached;

  const spec = ROUTE_SPECS[group];
  if (spec === 'hot') return getHotHandler(group);

  const mod = await import(spec.modulePath);
  const fn = mod[spec.exportName];
  if (typeof fn !== 'function') {
    throw new Error(`Missing export ${spec.exportName} for route group ${group}`);
  }
  const handler = (message: string) => normalizeHandlerResult(fn(message), group);
  handlerCache.set(group, handler);
  asyncLoadCount += 1;
  return handler;
}

export async function loadRouteGroup(group: RouteGroup): Promise<void> {
  await loadRouteHandler(group);
}

export function getLazyRouteLoaderStats(): {
  hotGroupCount: number;
  lazyGroupCount: number;
  cachedHandlerCount: number;
  syncLoadCount: number;
  asyncLoadCount: number;
  mismatchCount: number;
} {
  return {
    hotGroupCount: HOT_ROUTE_GROUPS.length,
    lazyGroupCount: LAZY_ROUTE_GROUPS.length,
    cachedHandlerCount: handlerCache.size,
    syncLoadCount: loadCount,
    asyncLoadCount,
    mismatchCount,
  };
}

export function detectRouteLoaderMismatch(group: RouteGroup): boolean {
  try {
    const syncHandler = getRouteHandlerSync(group);
    const result = syncHandler('routing loader mismatch probe');
    return !result.responseText.includes('unexpected shape');
  } catch {
    return true;
  }
}

export function resetLazyRouteLoaderForTests(): void {
  handlerCache.clear();
  loadCount = 0;
  asyncLoadCount = 0;
  mismatchCount = 0;
}

export { processUnifiedDecisionLayerRequest };
