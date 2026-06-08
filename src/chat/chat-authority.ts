/**
 * DevPulse V2 Chat Authority — sole owner of chat intake, answers, and response path.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  createTurnIdFromMessage,
  feedDidNotModifyAnswer,
  feedEventsAreNotAssistantAnswers,
  getDevPulseV2InlineOperatorFeedAuthority,
  resetDevPulseV2InlineOperatorFeedAuthorityForTests,
  runFoundationFeedForTurn,
} from '../operator-feed/index.js';
import type { InlineOperatorFeedEvent } from '../operator-feed/types.js';
import { getDevPulseV2ShellAuthority } from '../shell/shell-authority.js';
import { injectChatSurfaceIntoShell } from '../shell/shell-surface.js';
import {
  createTaskId,
  getDevPulseV2TaskGovernor,
  resetDevPulseV2TaskGovernorForTests,
} from '../task-governor/task-governor.js';
import { assertAnswerContract, type DevPulseV2Answer } from './answer-contract.js';
import { renderChatSurface } from './chat-surface.js';
import { generateFoundationResponse } from './minimal-response-engine.js';
import {
  CHAT_OWNER_MODULE,
  type ChatMessage,
  type ChatStartupGovernorUsage,
  type DevPulseV2ChatState,
} from './types.js';

let singleton: DevPulseV2ChatAuthority | null = null;

function createChatId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DevPulseV2ChatAuthority {
  private state: DevPulseV2ChatState;
  private lastAnswer: DevPulseV2Answer | null = null;
  private chatSurfaceHtml: string | null = null;
  private mountedShellHtml: string | null = null;
  private inputValue = '';
  private activeTurnFeedEvents: InlineOperatorFeedEvent[] = [];
  private feedAttached = false;
  private governorUsage: ChatStartupGovernorUsage = {
    tasksScheduled: 0,
    p0Tasks: 0,
    p1Tasks: 0,
    p3Tasks: 0,
    p4Tasks: 0,
    usedTaskGovernor: false,
  };

  constructor(startedAt: number = Date.now()) {
    this.state = {
      chatId: createChatId(),
      startedAt,
      status: 'IDLE',
      messages: [],
      warnings: [],
      errors: [],
    };
  }

  static readonly ownerModule = CHAT_OWNER_MODULE;
  static readonly ownerDomain = 'chat_authority' as const;

  static assertRegistryOwnership(): boolean {
    const chatOwner = getDevPulseV2Owner('chat_authority');
    const answerOwner = getDevPulseV2Owner('chat_answer_authority');
    return (
      chatOwner.ownerModule === CHAT_OWNER_MODULE &&
      answerOwner.ownerModule === CHAT_OWNER_MODULE
    );
  }

  getState(): DevPulseV2ChatState {
    return {
      ...this.state,
      messages: [...this.state.messages],
      warnings: [...this.state.warnings],
      errors: [...this.state.errors],
    };
  }

  getLastAnswer(): DevPulseV2Answer | null {
    return this.lastAnswer ? { ...this.lastAnswer } : null;
  }

  getChatSurfaceHtml(): string | null {
    return this.chatSurfaceHtml;
  }

  getMountedShellHtml(): string | null {
    return this.mountedShellHtml;
  }

  getActiveTurnFeedEvents(): InlineOperatorFeedEvent[] {
    return [...this.activeTurnFeedEvents];
  }

  isFeedAttached(): boolean {
    return this.feedAttached;
  }

  getGovernorUsage(): ChatStartupGovernorUsage {
    return { ...this.governorUsage };
  }

  /**
   * Mount chat into Shell placeholder via Task Governor — P0/P1 only.
   * Does not replace Shell Authority.
   */
  async mountIntoShell(): Promise<string> {
    const governor = getDevPulseV2TaskGovernor();
    this.governorUsage.usedTaskGovernor = true;

    let mountResult = '';

    this.scheduleChatTask(governor, 'P0_VISIBLE_USER_PATH', 'chat-mount-surface', () => {
      this.refreshSurfaceHtml();
      const shell = getDevPulseV2ShellAuthority();
      const shellHtml = shell.getSurfaceHtml();
      if (!shellHtml) {
        this.state.errors.push('Shell surface not ready — boot Shell Authority first');
        return;
      }
      mountResult = injectChatSurfaceIntoShell(shellHtml, this.chatSurfaceHtml ?? '');
      this.mountedShellHtml = mountResult;
    });

    await governor.runUntilBudgetExhausted(50);
    return mountResult;
  }

  /**
   * Submit user message — Chat Authority owns answer; feed observes turn progress.
   */
  async submitUserMessage(text: string): Promise<DevPulseV2Answer> {
    this.state.status = 'RECEIVING_INPUT';
    this.feedAttached = true;

    const userMessage: ChatMessage = {
      messageId: createMessageId('user'),
      role: 'user',
      text,
      createdAt: Date.now(),
    };
    this.state.messages.push(userMessage);

    const turnId = createTurnIdFromMessage(userMessage.messageId);
    const feedAuthority = getDevPulseV2InlineOperatorFeedAuthority();

    const bridgeResult = await runFoundationFeedForTurn({
      turnId,
      feedAuthority,
      generateAnswer: () => {
        this.state.status = 'GENERATING_RESPONSE';
        let answer = generateFoundationResponse(text);

        if (!assertAnswerContract(answer)) {
          this.state.errors.push('Answer contract violation');
          answer = generateFoundationResponse('__FORCE_ERROR__');
        }

        return answer;
      },
    });

    const answer = bridgeResult.answer;
    const answerBefore = { ...answer };

    this.activeTurnFeedEvents = bridgeResult.events;
    this.lastAnswer = answer;

    if (!feedDidNotModifyAnswer(answerBefore, answer)) {
      this.state.errors.push('Feed must not modify visibleAnswerText');
    }

    if (!feedEventsAreNotAssistantAnswers(bridgeResult.events, answer)) {
      this.state.errors.push('Feed event must not duplicate assistant answer text');
    }

    if (answer.status === 'READY') {
      const assistantMessage: ChatMessage = {
        messageId: createMessageId('assistant'),
        role: 'assistant',
        text: answer.visibleAnswerText,
        createdAt: Date.now(),
      };
      this.state.messages.push(assistantMessage);
      this.state.status = 'ANSWER_READY';
    } else if (answer.status === 'EMPTY') {
      this.state.warnings.push('Empty answer — no assistant message added');
      this.state.status = 'ANSWER_READY';
    } else {
      this.state.errors.push(...answer.errors);
      this.state.status = 'ERROR';
    }

    this.inputValue = '';
    this.refreshSurfaceHtml();

    const shellHtml = getDevPulseV2ShellAuthority().getSurfaceHtml();
    if (shellHtml && this.chatSurfaceHtml) {
      this.mountedShellHtml = injectChatSurfaceIntoShell(shellHtml, this.chatSurfaceHtml);
    }

    this.governorUsage.usedTaskGovernor = true;
    const feedUsage = feedAuthority.getGovernorUsage();
    this.governorUsage.p1Tasks += feedUsage.p1Tasks;
    this.governorUsage.tasksScheduled += feedUsage.tasksScheduled;

    return { ...answer };
  }

  private refreshSurfaceHtml(): void {
    this.chatSurfaceHtml = renderChatSurface({
      messages: this.state.messages,
      lastAnswer: this.lastAnswer,
      inputValue: this.inputValue,
      turnFeedEvents: this.activeTurnFeedEvents,
    });
  }

  private scheduleChatTask(
    governor: ReturnType<typeof getDevPulseV2TaskGovernor>,
    priority: 'P0_VISIBLE_USER_PATH' | 'P1_CORE_INTERACTION',
    label: string,
    run: () => void,
  ): void {
    const result = governor.enqueueTask({
      id: createTaskId(label),
      label,
      priority,
      estimatedCostMs: 1,
      createdAt: Date.now(),
      run,
    });

    if (result.accepted) {
      this.governorUsage.tasksScheduled += 1;
      if (priority === 'P0_VISIBLE_USER_PATH') this.governorUsage.p0Tasks += 1;
      if (priority === 'P1_CORE_INTERACTION') this.governorUsage.p1Tasks += 1;
    }
  }
}

export function createDevPulseV2ChatAuthority(
  startedAt?: number,
): DevPulseV2ChatAuthority {
  singleton = new DevPulseV2ChatAuthority(startedAt);
  return singleton;
}

export function getDevPulseV2ChatAuthority(): DevPulseV2ChatAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ChatAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ChatAuthorityForTests(
  startedAt: number = Date.now(),
): DevPulseV2ChatAuthority {
  resetDevPulseV2TaskGovernorForTests();
  resetDevPulseV2InlineOperatorFeedAuthorityForTests(startedAt);
  singleton = new DevPulseV2ChatAuthority(startedAt);
  return singleton;
}
