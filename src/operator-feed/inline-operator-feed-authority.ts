/**
 * DevPulse V2 Inline Operator Feed Authority — feed events only, not answers.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  createTaskId,
  getDevPulseV2TaskGovernor,
  resetDevPulseV2TaskGovernorForTests,
} from '../task-governor/task-governor.js';
import type {
  DevPulseV2InlineOperatorFeedState,
  FeedEventStatus,
  FeedGovernorUsage,
  FeedStage,
  InlineOperatorFeedEvent,
} from './types.js';
import { FEED_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2InlineOperatorFeedAuthority | null = null;

function createFeedId(): string {
  return `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEventId(): string {
  return `feed-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DevPulseV2InlineOperatorFeedAuthority {
  private state: DevPulseV2InlineOperatorFeedState;
  private governorUsage: FeedGovernorUsage = {
    tasksScheduled: 0,
    p1Tasks: 0,
    p3Tasks: 0,
    p4Tasks: 0,
    usedTaskGovernor: false,
  };

  private eventSequence = 0;

  constructor(startedAt: number = Date.now()) {
    this.state = {
      feedId: createFeedId(),
      startedAt,
      status: 'IDLE',
      events: [],
      warnings: [],
      errors: [],
    };
  }

  static readonly ownerModule = FEED_OWNER_MODULE;
  static readonly ownerDomain = 'inline_operator_feed' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('inline_operator_feed');
    return owner.ownerModule === FEED_OWNER_MODULE;
  }

  getState(): DevPulseV2InlineOperatorFeedState {
    return {
      ...this.state,
      events: this.getOrderedEvents(),
      warnings: [...this.state.warnings],
      errors: [...this.state.errors],
    };
  }

  getGovernorUsage(): FeedGovernorUsage {
    return { ...this.governorUsage };
  }

  getEventsForTurn(turnId: string): InlineOperatorFeedEvent[] {
    return this.getOrderedEvents().filter((e) => e.turnId === turnId);
  }

  getOrderedEvents(): InlineOperatorFeedEvent[] {
    return [...this.state.events].sort((a, b) => a.createdAt - b.createdAt);
  }

  async publishEvent(
    turnId: string,
    stage: FeedStage,
    visibleText: string,
    status: FeedEventStatus = 'DONE',
  ): Promise<InlineOperatorFeedEvent> {
    const governor = getDevPulseV2TaskGovernor();
    this.governorUsage.usedTaskGovernor = true;

    let created: InlineOperatorFeedEvent = this.buildEvent(turnId, stage, visibleText, status);

    this.scheduleFeedTask(governor, `feed-${stage.toLowerCase()}`, () => {
      const trimmed = visibleText.trim();
      if (trimmed.length === 0) {
        this.state.errors.push(`Feed event ${stage} missing visibleText`);
        created = this.buildEvent(turnId, stage, '', 'ERROR', ['visibleText is mandatory'], this.eventSequence);
        this.state.status = 'ERROR';
      } else {
        this.eventSequence += 1;
        created = this.buildEvent(turnId, stage, trimmed, status, [], this.eventSequence);
        this.state.status = 'ACTIVE';
      }
      this.state.events.push(created);
    });

    await governor.runNextTask();
    return { ...created };
  }

  private buildEvent(
    turnId: string,
    stage: FeedStage,
    visibleText: string,
    status: FeedEventStatus,
    errors: string[] = [],
    sequence: number = 0,
  ): InlineOperatorFeedEvent {
    return {
      eventId: createEventId(),
      turnId,
      createdAt: this.state.startedAt + sequence,
      stage,
      visibleText,
      status,
      warnings: [],
      errors,
    };
  }

  private scheduleFeedTask(
    governor: ReturnType<typeof getDevPulseV2TaskGovernor>,
    label: string,
    run: () => void,
  ): void {
    const result = governor.enqueueTask({
      id: createTaskId(label),
      label,
      priority: 'P1_CORE_INTERACTION',
      estimatedCostMs: 1,
      createdAt: Date.now(),
      run,
    });

    if (result.accepted) {
      this.governorUsage.tasksScheduled += 1;
      this.governorUsage.p1Tasks += 1;
    }
  }
}

export function createDevPulseV2InlineOperatorFeedAuthority(
  startedAt?: number,
): DevPulseV2InlineOperatorFeedAuthority {
  singleton = new DevPulseV2InlineOperatorFeedAuthority(startedAt);
  return singleton;
}

export function getDevPulseV2InlineOperatorFeedAuthority(): DevPulseV2InlineOperatorFeedAuthority {
  if (!singleton) {
    singleton = new DevPulseV2InlineOperatorFeedAuthority();
  }
  return singleton;
}

export function resetDevPulseV2InlineOperatorFeedAuthorityForTests(
  startedAt: number = Date.now(),
): DevPulseV2InlineOperatorFeedAuthority {
  resetDevPulseV2TaskGovernorForTests();
  singleton = new DevPulseV2InlineOperatorFeedAuthority(startedAt);
  return singleton;
}
