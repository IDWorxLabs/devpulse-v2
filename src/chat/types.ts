/** DevPulse V2 Chat Authority — state types. */

export type ChatStatus =
  | 'IDLE'
  | 'RECEIVING_INPUT'
  | 'GENERATING_RESPONSE'
  | 'ANSWER_READY'
  | 'ERROR';

export interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

export interface DevPulseV2ChatState {
  chatId: string;
  startedAt: number;
  status: ChatStatus;
  messages: ChatMessage[];
  warnings: string[];
  errors: string[];
}

export interface ChatStartupGovernorUsage {
  tasksScheduled: number;
  p0Tasks: number;
  p1Tasks: number;
  p3Tasks: number;
  p4Tasks: number;
  usedTaskGovernor: boolean;
}

export interface ChatAuthorityReport {
  chatAuthorityOwner: string;
  answerAuthorityOwner: string;
  messageCount: number;
  lastAnswerStatus: string | null;
  visibleAnswerTextPresent: boolean;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
  governorUsage: ChatStartupGovernorUsage;
}

export const CHAT_OWNER_MODULE = 'devpulse_v2_chat_authority';
export const CHAT_ANSWER_SOURCE = 'CHAT_AUTHORITY' as const;
export const CHAT_PASS_TOKEN = 'DEVPULSE_V2_CHAT_AUTHORITY_FOUNDATION_V1_PASS';

export const FOUNDATION_RESPONSE_TEXT =
  'DevPulse V2 Chat Authority received your message. Full intelligence is not active yet.';
