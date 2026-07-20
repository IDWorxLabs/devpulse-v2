/**
 * Universal Action Materialization Engine V1 — handler generation.
 */

import type { UniversalActionDescriptor, UniversalActionMaterializationInput } from './universal-action-types.js';
import { escActionString } from './universal-action-types.js';
import {
  generateActionRuntimeHelpers,
  generateAdapterDispatchCase,
  moduleIdToPascalCase,
} from './action-execution-adapters.js';

export function generateActionHandlersSource(
  descriptors: readonly UniversalActionDescriptor[],
  input: UniversalActionMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const dispatchCases = descriptors.map((d) => generateAdapterDispatchCase(d, pascal)).join('\n');
  const confirmActionIds = descriptors.filter((d) => d.confirmationPolicy.required).map((d) => d.actionId);

  return `/** Universal action handlers — ${escActionString(input.moduleDisplayName)} */
import { useCallback, useState } from 'react';
import type { ${pascal}CrudRuntimeState } from './${input.moduleId}.runtime-state';
import type { ${pascal}Entity } from './${input.moduleId}.types';

const CONFIRM_ACTION_IDS = new Set<string>([${confirmActionIds.map((id) => `'${id}'`).join(', ')}]);

export interface ${pascal}ActionHandlerState {
  pending: boolean;
  error: string | null;
  success: string | null;
  blockedMessage: string | null;
  pendingConfirmActionId: string | null;
  inputLabel: string;
  setInputLabel: (value: string) => void;
  executeAction: (actionId: string) => void;
  confirmPendingAction: () => void;
  cancelPendingAction: () => void;
}

export function use${pascal}ActionHandlers(crud: ${pascal}CrudRuntimeState): ${pascal}ActionHandlerState {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [pendingConfirmActionId, setPendingConfirmActionId] = useState<string | null>(null);
  const [inputLabel, setInputLabel] = useState('');

  const runAction = useCallback(
    (actionId: string) => {
      setPending(true);
      setError(null);
      setSuccess(null);
      setBlockedMessage(null);
      try {
        switch (actionId) {
${dispatchCases}
          default:
            setError('Unknown action');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setPending(false);
      }
    },
    [crud, inputLabel],
  );

  const executeAction = useCallback(
    (actionId: string) => {
      if (CONFIRM_ACTION_IDS.has(actionId)) {
        setPendingConfirmActionId(actionId);
        return;
      }
      runAction(actionId);
    },
    [runAction],
  );

  const confirmPendingAction = useCallback(() => {
    if (!pendingConfirmActionId) return;
    const id = pendingConfirmActionId;
    setPendingConfirmActionId(null);
    runAction(id);
  }, [pendingConfirmActionId, runAction]);

  const cancelPendingAction = useCallback(() => {
    setPendingConfirmActionId(null);
  }, []);

  return {
    pending,
    error,
    success,
    blockedMessage,
    pendingConfirmActionId,
    inputLabel,
    setInputLabel,
    executeAction,
    confirmPendingAction,
    cancelPendingAction,
  };
}
${input.crudBacked ? generateActionRuntimeHelpers(pascal) : ''}
`;
}

export function generateActionDescriptorsSource(
  descriptors: readonly UniversalActionDescriptor[],
  input: UniversalActionMaterializationInput,
): string {
  return `/** Universal action descriptors — ${escActionString(input.moduleDisplayName)} */
import type { UniversalActionDescriptorSnapshot } from '../../universal-action-runtime/types';

export const ${moduleIdToPascalCase(input.moduleId).replace(/[^A-Za-z]/g, '')}_UNIVERSAL_ACTIONS: UniversalActionDescriptorSnapshot[] = ${JSON.stringify(
    descriptors.map((d) => ({
      actionId: d.actionId,
      label: d.label,
      semanticType: d.semanticType,
      supportClassification: d.supportClassification,
      executionStrategy: d.executionStrategy,
      sourceEnvelopePath: d.sourceEnvelopePath,
      blockedReason: d.blockedReason ?? null,
    })),
    null,
    2,
  )} as UniversalActionDescriptorSnapshot[];
`;
}
