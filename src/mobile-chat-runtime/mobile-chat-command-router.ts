/**
 * Mobile Chat Runtime Foundation — command router (routing metadata only).
 */

import { getStoredMobileChatSession, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatLifecycleEvent } from './mobile-chat-lifecycle.js';
import type { MobileChatCommandRoute } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

let routeCounter = 0;

export function resetMobileChatRouteCounterForTests(): void {
  routeCounter = 0;
}

const ROUTING_TARGETS = [
  'mobile_command_runtime_foundation',
  'project_vault',
  'operator_feed',
  'cloud_runtime_foundation',
  'workspace_hosting_foundation',
  'persistent_build_runtime_foundation',
  'cloud_verification_foundation',
  'cloud_monitoring_foundation',
  'world2_execution',
  'aidev_execution',
] as const;

export function routeMobileChatIntent(mobileChatId: string, promptText = ''): MobileChatCommandRoute[] {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return [];

  const lower = promptText.toLowerCase();
  const targets: string[] = ['mobile_command_runtime_foundation', 'project_vault', 'operator_feed'];

  if (lower.includes('runtime') || lower.includes('cloud')) targets.push('cloud_runtime_foundation');
  if (lower.includes('workspace')) targets.push('workspace_hosting_foundation');
  if (lower.includes('build')) targets.push('persistent_build_runtime_foundation');
  if (lower.includes('verify') || lower.includes('verification')) targets.push('cloud_verification_foundation');
  if (lower.includes('monitor')) targets.push('cloud_monitoring_foundation');
  if (lower.includes('world2') || lower.includes('world 2')) targets.push('world2_execution');
  if (lower.includes('aidev') || lower.includes('autonomous')) targets.push('aidev_execution');

  const uniqueTargets = [...new Set(targets)];
  const routes: MobileChatCommandRoute[] = uniqueTargets.map((targetSystem) => {
    routeCounter += 1;
    return {
      routeId: `mroute-${routeCounter.toString().padStart(4, '0')}`,
      mobileChatId,
      targetSystem,
      routeReason: `Routed to ${targetSystem} — metadata only`,
      routedAt: Date.now(),
      metadataOnly: true,
    };
  });

  storeMobileChatSession({
    ...session,
    mobileChatCommandRoutes: [...session.mobileChatCommandRoutes, ...routes],
    updatedAt: Date.now(),
  });

  recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_ROUTED_TO_COMMAND', `${routes.length} routes`);
  setMobileChatState(mobileChatId, 'ROUTED_TO_COMMAND', true);

  for (const route of routes) {
    recordMobileChatHistoryEntry({
      mobileChatId,
      category: 'ROUTING',
      summary: `Routed to ${route.targetSystem}`,
      scopeUsed: route.routeId,
    });
  }

  return routes;
}

export function listRoutingTargets(): readonly string[] {
  return ROUTING_TARGETS;
}

export function listRoutesForMobileChat(mobileChatId: string): MobileChatCommandRoute[] {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatCommandRoutes ?? [];
}

export function getPrimaryRouteTarget(mobileChatId: string): string | null {
  const routes = listRoutesForMobileChat(mobileChatId);
  return routes[0]?.targetSystem ?? null;
}

export function routeAuthorityModule(): string {
  return MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE;
}
