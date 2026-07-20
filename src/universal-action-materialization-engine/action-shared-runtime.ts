/**
 * Universal Action Materialization Engine V1 — shared action runtime (generated into workspace).
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';

const RUNTIME_ROOT = 'src/universal-action-runtime';

export function buildUniversalActionSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: `${RUNTIME_ROOT}/types.ts`,
      content: `/** Universal action runtime — shared types */
export interface UniversalActionDescriptorSnapshot {
  actionId: string;
  label: string;
  semanticType: string;
  supportClassification: string;
  executionStrategy: string;
  sourceEnvelopePath: string;
  blockedReason: string | null;
}

export type UniversalActionNavigateDetail = { route: string };
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/action-dispatch.ts`,
      content: `/** Universal action dispatch helpers */
export function dispatchUniversalActionNavigate(route: string): void {
  window.dispatchEvent(new CustomEvent('universal-action-navigate', { detail: { route } }));
}

export function subscribeUniversalActionNavigate(handler: (route: string) => void): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ route: string }>).detail;
    if (detail?.route) handler(detail.route);
  };
  window.addEventListener('universal-action-navigate', listener);
  return () => window.removeEventListener('universal-action-navigate', listener);
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './action-dispatch';
`,
    },
  ];
}
