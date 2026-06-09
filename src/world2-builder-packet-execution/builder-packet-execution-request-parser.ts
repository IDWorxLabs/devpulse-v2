/**
 * Builder packet execution request parser.
 */

import type { BuilderPacket, BuilderPacketRawStep } from './types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `bpreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetBuilderPacketExecutionRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseBuilderPacketExecutionQuery(query: string): {
  requestId: string;
  query: string;
  title: string;
  goal: string;
} {
  const lower = query.toLowerCase().trim();
  let title = 'Builder Packet Execution Request';
  let goal = 'Prepare governed builder packet execution instructions without performing apply operations';

  if (lower.includes('can this builder packet execute')) {
    title = 'Can This Builder Packet Execute';
    goal = 'Evaluate whether builder packet can produce a controlled execution packet';
  } else if (lower.includes('prepare builder packet')) {
    title = 'Prepare Builder Packet Execution';
    goal = 'Convert approved builder packet into inspectable execution packet';
  } else if (lower.includes('why is this builder packet blocked')) {
    title = 'Builder Packet Blockers';
    goal = 'Identify why builder packet execution is blocked';
  } else if (lower.includes('what approvals are needed')) {
    title = 'Builder Packet Approval Requirements';
    goal = 'Record founder and governance approvals required before World 2 build';
  } else if (lower.includes('show world 2 execution packet')) {
    title = 'World 2 Execution Packet';
    goal = 'Display prepared execution packet steps and risks';
  }

  return { requestId: nextRequestId(), query, title, goal };
}

export function createDefaultBuilderPacket(overrides: Partial<BuilderPacket> = {}): BuilderPacket {
  const defaultSteps: BuilderPacketRawStep[] = [
    {
      title: 'Read project context',
      description: 'Load workspace and project context for builder packet',
      targetArea: 'workspace-intelligence',
      stepType: 'READ_CONTEXT',
    },
    {
      title: 'Plan implementation change',
      description: 'Define governed change plan without applying modifications',
      targetArea: 'build-task-runtime',
      stepType: 'PLAN_CHANGE',
    },
    {
      title: 'Generate code proposal',
      description: 'Create proposal-only code artifacts',
      targetArea: 'code-generation-runtime',
      stepType: 'GENERATE_CODE_PROPOSAL',
    },
    {
      title: 'Propose new file',
      description: 'Propose file creation without writing to disk',
      targetArea: 'src/world2-builder-packet-execution',
      stepType: 'CREATE_FILE_PROPOSAL',
    },
    {
      title: 'Propose file modification',
      description: 'Propose file changes without applying',
      targetArea: 'src/world2-builder-packet-execution/types.ts',
      stepType: 'MODIFY_FILE_PROPOSAL',
    },
    {
      title: 'Propose test run',
      description: 'Simulation-only test proposal',
      targetArea: 'testing-runtime',
      stepType: 'RUN_TEST_PROPOSAL',
    },
    {
      title: 'Report preparation result',
      description: 'Publish execution packet readiness report',
      targetArea: 'operator-feed',
      stepType: 'REPORT_RESULT',
    },
  ];

  return {
    builderPacketId: 'bpack-default-001',
    projectId: 'devpulse-v2',
    workspaceId: 'world2-workspace-001',
    sourcePlanId: 'plan-w2-001',
    executionIntent: 'Prepare World 2 builder packet execution packet — simulation only',
    targetWorld: 'WORLD_2',
    steps: defaultSteps,
    ...overrides,
  };
}
