/**
 * Requirement Contract — extract structured requirements from user idea.
 */

import { MAX_REQUIREMENTS } from './requirements-to-plan-contract-registry.js';
import type {
  RequirementContract,
  RequirementContractEntry,
  RequirementType,
  UserIdeaContract,
} from './requirements-to-plan-contract-types.js';

let reqCounter = 0;

export function resetRequirementContractCounterForTests(): void {
  reqCounter = 0;
}

function nextReqId(): string {
  reqCounter += 1;
  return `req-${String(reqCounter).padStart(3, '0')}`;
}

function req(
  sourceIdeaId: string,
  requirementType: RequirementType,
  description: string,
  priority: RequirementContractEntry['priority'],
  acceptanceCriteria: string[],
  evidenceSource: string,
  status: RequirementContractEntry['status'] = 'EXTRACTED',
): RequirementContractEntry {
  return {
    readOnly: true,
    requirementId: nextReqId(),
    sourceIdeaId,
    requirementType,
    description,
    priority,
    acceptanceCriteria,
    evidenceSource,
    status,
  };
}

function extractFromCrmPrompt(idea: UserIdeaContract): RequirementContractEntry[] {
  const lower = idea.rawPrompt.toLowerCase();
  const entries: RequirementContractEntry[] = [];

  entries.push(
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Manage contacts with create, read, update, and list',
      'CRITICAL',
      ['User can add contact', 'User can view contact list', 'User can edit contact details'],
      'prompt:contacts',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Manage deals/pipeline with stages and ownership',
      'CRITICAL',
      ['User can create deal', 'User can move deal through stages', 'Deal linked to contact'],
      'prompt:deals',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Task management linked to contacts and deals',
      'HIGH',
      ['User can create task', 'Task assignable to team member', 'Task shows on dashboard'],
      'prompt:tasks',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'AUTH',
      'User login and session management',
      'CRITICAL',
      ['User can sign in', 'Session persists securely', 'Unauthorized access blocked'],
      'prompt:login',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'UI_UX',
      'Sales dashboard with pipeline summary and tasks',
      'HIGH',
      ['Dashboard shows deal counts', 'Dashboard shows open tasks', 'Dashboard loads after login'],
      'prompt:dashboard',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'AUTH',
      'Admin role with elevated permissions',
      'CRITICAL',
      ['Admin can manage users/roles', 'Non-admin cannot access admin actions'],
      'prompt:admin role',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'DATA',
      'Persistent storage for contacts, deals, tasks, and users',
      'CRITICAL',
      ['Data survives restart', 'Entities reference each other consistently'],
      'inferred:data model',
      'INFERRED',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'PLATFORM',
      'Web application for small sales team',
      'HIGH',
      ['Usable in modern browser', 'Responsive layout for desktop-first team use'],
      `prompt:${idea.platformHints.join(',') || 'web'}`,
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'SECURITY',
      'Role-based access control for sales vs admin',
      'CRITICAL',
      ['Sales users scoped to own records where appropriate', 'Admin actions audited'],
      'prompt:admin role',
    ),
  );
  entries.push(
    req(
      idea.ideaId,
      'NON_FUNCTIONAL',
      'Founder-verifiable acceptance checks for CRM flows',
      'HIGH',
      ['Login flow verifiable', 'CRUD flows verifiable', 'Role restrictions verifiable'],
      'contract:verification',
    ),
  );

  if (/team|small sales/i.test(lower)) {
    entries.push(
      req(
        idea.ideaId,
        'NON_FUNCTIONAL',
        'Support small sales team concurrency without data loss',
        'MEDIUM',
        ['Multiple users can work concurrently', 'No lost updates on core entities'],
        'prompt:small sales team',
      ),
    );
  }

  return entries;
}

function extractFromBookingPrompt(idea: UserIdeaContract): RequirementContractEntry[] {
  return [
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Salon appointment booking for customers',
      'CRITICAL',
      ['Customer can view availability', 'Customer can book appointment'],
      'prompt:booking',
    ),
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Staff schedule management',
      'HIGH',
      ['Staff can view daily schedule', 'Staff can block time slots'],
      'prompt:salon',
    ),
    req(
      idea.ideaId,
      'DATA',
      'Appointment and customer data model',
      'HIGH',
      ['Appointments linked to customer and staff', 'No double-booking'],
      'inferred:data model',
      'INFERRED',
    ),
    req(
      idea.ideaId,
      'UI_UX',
      'Booking interface for customers',
      'HIGH',
      ['Booking flow completable in browser'],
      'inferred:ui',
      'INFERRED',
    ),
  ];
}

function extractFromTaskTrackerPrompt(idea: UserIdeaContract): RequirementContractEntry[] {
  return [
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Add new tasks from user input',
      'CRITICAL',
      ['User can type a task and add it to the list', 'Added task appears immediately'],
      'prompt:add tasks',
    ),
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Mark tasks complete or incomplete',
      'CRITICAL',
      ['User can toggle task completion', 'Completed tasks are visually distinct'],
      'prompt:mark them complete',
    ),
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Delete tasks from the list',
      'CRITICAL',
      ['User can delete a task', 'Deleted task is removed from all views'],
      'prompt:delete them',
    ),
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Filter tasks by all, active, and completed',
      'CRITICAL',
      ['User can view all tasks', 'User can view active tasks only', 'User can view completed tasks only'],
      'prompt:filter by all/active/completed',
    ),
    req(
      idea.ideaId,
      'FUNCTIONAL',
      'Display count of remaining active tasks',
      'HIGH',
      ['Active task count updates when tasks change', 'Count reflects incomplete tasks only'],
      'prompt:count of remaining active tasks',
    ),
    req(
      idea.ideaId,
      'UI_UX',
      'Clean modern browser UI for task management',
      'HIGH',
      ['Layout is readable on desktop browser', 'Primary actions are obvious'],
      'prompt:clean modern UI',
    ),
    req(
      idea.ideaId,
      'PLATFORM',
      'Browser-based task tracker application',
      'CRITICAL',
      ['Application runs in a modern web browser', 'Primary flows work without page reload'],
      'prompt:work in the browser',
    ),
    req(
      idea.ideaId,
      'DATA',
      'In-browser task state for session usage',
      'MEDIUM',
      ['Tasks persist while the app is open', 'Task list state remains consistent during filtering'],
      'inferred:client state',
      'INFERRED',
    ),
  ];
}

export function buildRequirementContract(idea: UserIdeaContract): RequirementContract | null {
  if (idea.status === 'INSUFFICIENT_INPUT') return null;

  let requirements: RequirementContractEntry[] = [];
  const lower = idea.rawPrompt.toLowerCase();

  if (/crm|contacts|deals|sales team/i.test(lower)) {
    requirements = extractFromCrmPrompt(idea);
  } else if (/booking|salon|appointment/i.test(lower)) {
    requirements = extractFromBookingPrompt(idea);
  } else if (/task tracker|todo app|todo list/i.test(lower) && /tasks?/i.test(lower)) {
    requirements = extractFromTaskTrackerPrompt(idea);
  } else if (wordCount(idea.rawPrompt) >= 8) {
    requirements = [
      req(
        idea.ideaId,
        'FUNCTIONAL',
        `Core product capability: ${idea.normalizedGoal}`,
        'CRITICAL',
        ['Primary user flow defined and testable'],
        'prompt:normalized goal',
      ),
      req(
        idea.ideaId,
        'PLATFORM',
        `Deploy on ${idea.platformHints[0] ?? 'web'}`,
        'HIGH',
        ['Application reachable on target platform'],
        'inferred:platform',
        'INFERRED',
      ),
    ];
  }

  if (requirements.length === 0) return null;

  return {
    readOnly: true,
    contractId: `requirement-contract-${idea.ideaId}`,
    sourceIdeaId: idea.ideaId,
    requirements: requirements.slice(0, MAX_REQUIREMENTS),
  };
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
