/**
 * Chat-to-Build Execution Bridge V1 — deterministic engineering state machine.
 */

import type {
  ChatToBuildBridgeEvent,
  ChatToBuildEngineeringState,
  ChatToBuildProgressItem,
} from './bridge-types.js';
import { CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION } from './bridge-types.js';

const PROGRESS_TEMPLATE: Array<{ state: ChatToBuildEngineeringState; label: string }> = [
  { state: 'INTENT_ANALYSIS', label: 'Intent understood' },
  { state: 'PROJECT_ALIGNMENT', label: 'Project context aligned' },
  { state: 'PROJECT_IDENTITY', label: 'Project identity resolved' },
  { state: 'PLANNING', label: 'Planning complete' },
  { state: 'ARCHITECTURE', label: 'Architecture complete' },
  { state: 'FEATURE_GENERATION', label: 'Universal Feature Contract generated' },
  { state: 'CODE_GENERATION', label: 'Modules generated' },
  { state: 'WORKSPACE_BUILD', label: 'Workspace materialized' },
  { state: 'RUNTIME_START', label: 'Runtime started' },
  { state: 'LIVE_PREVIEW', label: 'Live Preview ready' },
  { state: 'VALIDATION', label: 'Validation complete' },
  { state: 'FOUNDER_EVIDENCE', label: 'Engineering report generated' },
];

export class ChatToBuildExecutionStateMachine {
  private events: ChatToBuildBridgeEvent[] = [];
  private currentState: ChatToBuildEngineeringState = 'CHAT_RECEIVED';
  private counter = 0;

  getEvents(): ChatToBuildBridgeEvent[] {
    return this.events.slice();
  }

  getCurrentState(): ChatToBuildEngineeringState {
    return this.currentState;
  }

  transition(
    state: ChatToBuildEngineeringState,
    input: { title: string; detail: string; status?: ChatToBuildBridgeEvent['status'] },
  ): ChatToBuildBridgeEvent {
    this.counter += 1;
    this.currentState = state;
    const templateIndex = PROGRESS_TEMPLATE.findIndex((item) => item.state === state);
    const event: ChatToBuildBridgeEvent = {
      readOnly: true,
      contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
      state,
      eventId: `chat-to-build-${Date.now()}-${this.counter}`,
      timestamp: new Date().toISOString(),
      title: input.title,
      detail: input.detail,
      status: input.status ?? 'Active',
      section: 'Engineering',
      stepIndex: templateIndex >= 0 ? templateIndex + 1 : this.counter,
      stepTotal: PROGRESS_TEMPLATE.length,
    };
    this.events.push(event);
    return event;
  }

  completeLast(): void {
    const last = this.events[this.events.length - 1];
    if (last) last.status = 'Completed';
  }

  buildProgressItems(activeState?: ChatToBuildEngineeringState): ChatToBuildProgressItem[] {
    const resolvedState = activeState ?? this.currentState;

    // 'COMPLETE' and 'FAILED' are terminal states, not entries in PROGRESS_TEMPLATE — resolve them
    // against real engineering stage history instead of failing the lookup (which previously left
    // every step reported as 'pending', hiding real progress on both success and failure).
    if (resolvedState === 'COMPLETE') {
      return PROGRESS_TEMPLATE.map((item) => ({ readOnly: true, label: item.label, status: 'complete' }));
    }

    if (resolvedState === 'FAILED') {
      let lastReachedIndex = -1;
      for (const event of this.events) {
        const idx = PROGRESS_TEMPLATE.findIndex((item) => item.state === event.state);
        if (idx > lastReachedIndex) lastReachedIndex = idx;
      }
      return PROGRESS_TEMPLATE.map((item, index) => {
        let status: ChatToBuildProgressItem['status'] = 'pending';
        if (index < lastReachedIndex) status = 'complete';
        else if (index === lastReachedIndex) status = 'failed';
        return { readOnly: true, label: item.label, status };
      });
    }

    const activeIndex = PROGRESS_TEMPLATE.findIndex((item) => item.state === resolvedState);
    return PROGRESS_TEMPLATE.map((item, index) => {
      let status: ChatToBuildProgressItem['status'] = 'pending';
      if (index < activeIndex) {
        status = 'complete';
      } else if (index === activeIndex) {
        status = 'active';
      }
      return { readOnly: true, label: item.label, status };
    });
  }
}

export function createChatToBuildStateMachine(): ChatToBuildExecutionStateMachine {
  return new ChatToBuildExecutionStateMachine();
}
