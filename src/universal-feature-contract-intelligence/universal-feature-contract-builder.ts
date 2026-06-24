/**
 * Universal Feature Contract Intelligence V1 — contract builder.
 */

import type {
  BuildUniversalFeatureContractInput,
  UniversalAppProfile,
  UniversalFeatureAction,
  UniversalFeatureContract,
  UniversalFeatureEntity,
  UniversalFeatureOutcome,
  UniversalFeatureRule,
  UniversalFeatureWorkflow,
} from './universal-feature-contract-types.js';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function detectUniversalAppProfile(rawPrompt: string): UniversalAppProfile | null {
  const lower = rawPrompt.toLowerCase();

  if (
    includesAny(lower, [
      'school management',
      'school system',
      'students and teachers',
      'student',
      'teacher',
      'classroom',
      'classes',
    ]) &&
    includesAny(lower, ['school', 'student', 'teacher', 'class'])
  ) {
    return 'SCHOOL_MANAGEMENT_WEB_V1';
  }

  if (includesAny(lower, ['crm', 'customer relationship', 'sales pipeline', 'manage customers'])) {
    return 'CRM_WEB_V1';
  }

  if (includesAny(lower, ['inventory', 'stock', 'warehouse', 'inventory system', 'inventory item'])) {
    return 'INVENTORY_WEB_V1';
  }

  if (
    includesAny(lower, [
      'project management',
      'manage projects',
      'milestones',
      'sprint',
      'kanban board',
      'assign team',
    ])
  ) {
    return 'PROJECT_MANAGEMENT_WEB_V1';
  }

  if (includesAny(lower, ['task tracker', 'todo', 'to-do', 'checklist', 'add tasks', 'mark them complete'])) {
    return 'TASK_TRACKER_WEB_V1';
  }

  return null;
}

function entity(
  id: string,
  label: string,
  pluralLabel: string,
  navLabel: string,
  primary: boolean,
): UniversalFeatureEntity {
  const slug = slugify(label);
  return {
    id,
    label,
    pluralLabel,
    navLabel,
    slug,
    storageKey: `${slug}-records-v1`,
    primary,
  };
}

function crudActions(entityRef: UniversalFeatureEntity, extras: UniversalFeatureAction[] = []): UniversalFeatureAction[] {
  const base: UniversalFeatureAction[] = [
    {
      id: `create-${entityRef.id}`,
      entityId: entityRef.id,
      verb: 'create',
      label: `Create ${entityRef.label}`,
      required: true,
    },
    {
      id: `update-${entityRef.id}`,
      entityId: entityRef.id,
      verb: 'update',
      label: `Edit ${entityRef.label}`,
      required: true,
    },
    {
      id: `delete-${entityRef.id}`,
      entityId: entityRef.id,
      verb: 'delete',
      label: `Delete ${entityRef.label}`,
      required: true,
    },
    {
      id: `search-${entityRef.id}`,
      entityId: entityRef.id,
      verb: 'search',
      label: `Search ${entityRef.label}`,
      required: true,
    },
  ];
  return [...base, ...extras];
}

function buildProfileContract(input: {
  contractId: string;
  rawPrompt: string;
  profile: UniversalAppProfile;
}): UniversalFeatureContract {
  const generatedAt = new Date().toISOString();
  const lower = input.rawPrompt.toLowerCase();

  switch (input.profile) {
    case 'TASK_TRACKER_WEB_V1': {
      const task = entity('task', 'Task', 'Tasks', 'Tasks', true);
      return {
        contractVersion: '1.0',
        contractId: input.contractId,
        productProfile: input.profile,
        productName: 'Task Tracker',
        generatedAt,
        sourcePrompt: input.rawPrompt,
        entities: [task],
        actions: crudActions(task, [
          {
            id: 'complete-task',
            entityId: task.id,
            verb: 'complete',
            label: 'Complete Task',
            required: includesAny(lower, ['complete', 'done', 'finish']),
          },
          {
            id: 'filter-tasks',
            entityId: task.id,
            verb: 'search',
            label: 'Filter Tasks',
            required: includesAny(lower, ['filter', 'active', 'completed']),
          },
        ]),
        rules: [
          {
            id: 'task-requires-title',
            entityId: task.id,
            label: 'Task must have title',
            required: true,
          },
        ],
        workflows: [
          {
            id: 'task-status',
            entityId: task.id,
            label: 'Pending → Complete',
            stages: ['active', 'completed'],
            required: true,
          },
        ],
        outcomes: [
          { id: 'task-created', entityId: task.id, label: 'Task appears in list', required: true },
          { id: 'task-updated', entityId: task.id, label: 'Task updates persist', required: true },
          { id: 'task-removed', entityId: task.id, label: 'Task can be removed', required: true },
        ],
      };
    }

    case 'CRM_WEB_V1': {
      const customer = entity('customer', 'Customer', 'Customers', 'Customers', true);
      return {
        contractVersion: '1.0',
        contractId: input.contractId,
        productProfile: input.profile,
        productName: 'CRM',
        generatedAt,
        sourcePrompt: input.rawPrompt,
        entities: [customer],
        actions: crudActions(customer),
        rules: [
          {
            id: 'customer-name-required',
            entityId: customer.id,
            label: 'Customer must have a name',
            required: true,
          },
          {
            id: 'customer-email-unique',
            entityId: customer.id,
            label: 'Email must be unique',
            required: includesAny(lower, ['email']),
          },
        ],
        workflows: [
          {
            id: 'lead-to-customer',
            entityId: customer.id,
            label: 'Lead → Customer',
            stages: ['lead', 'customer'],
            required: false,
          },
        ],
        outcomes: [
          { id: 'customer-exists', entityId: customer.id, label: 'Customer appears in CRM', required: true },
          { id: 'customer-updated', entityId: customer.id, label: 'Customer updates persist', required: true },
          { id: 'customer-removed', entityId: customer.id, label: 'Customer can be removed', required: true },
        ],
      };
    }

    case 'INVENTORY_WEB_V1': {
      const item = entity('inventory-item', 'Inventory Item', 'Inventory Items', 'Inventory', true);
      return {
        contractVersion: '1.0',
        contractId: input.contractId,
        productProfile: input.profile,
        productName: 'Inventory System',
        generatedAt,
        sourcePrompt: input.rawPrompt,
        entities: [item],
        actions: [
          {
            id: 'create-inventory-item',
            entityId: item.id,
            verb: 'create',
            label: 'Add Item',
            required: true,
          },
          {
            id: 'update-inventory-item',
            entityId: item.id,
            verb: 'update',
            label: 'Edit Item',
            required: true,
          },
          {
            id: 'delete-inventory-item',
            entityId: item.id,
            verb: 'delete',
            label: 'Remove Item',
            required: true,
          },
          {
            id: 'search-inventory-item',
            entityId: item.id,
            verb: 'search',
            label: 'Search Item',
            required: includesAny(lower, ['search']),
          },
        ],
        rules: [
          {
            id: 'item-name-required',
            entityId: item.id,
            label: 'Inventory item must have a name',
            required: true,
          },
        ],
        workflows: [],
        outcomes: [
          { id: 'inventory-updated', entityId: item.id, label: 'Inventory updates correctly', required: true },
        ],
      };
    }

    case 'SCHOOL_MANAGEMENT_WEB_V1': {
      const student = entity('student', 'Student', 'Students', 'Students', true);
      const teacher = entity('teacher', 'Teacher', 'Teachers', 'Teachers', false);
      const schoolClass = entity('class', 'Class', 'Classes', 'Classes', false);
      return {
        contractVersion: '1.0',
        contractId: input.contractId,
        productProfile: input.profile,
        productName: 'School Management System',
        generatedAt,
        sourcePrompt: input.rawPrompt,
        entities: [student, teacher, schoolClass],
        actions: [
          ...crudActions(student),
          {
            id: 'assign-student',
            entityId: student.id,
            verb: 'assign',
            label: 'Assign Student',
            required: includesAny(lower, ['assign']),
          },
          {
            id: 'create-teacher',
            entityId: teacher.id,
            verb: 'create',
            label: 'Create Teacher',
            required: true,
          },
          {
            id: 'create-class',
            entityId: schoolClass.id,
            verb: 'create',
            label: 'Create Class',
            required: true,
          },
        ],
        rules: [
          {
            id: 'student-name-required',
            entityId: student.id,
            label: 'Student must have a name',
            required: true,
          },
        ],
        workflows: [
          {
            id: 'student-class-assignment',
            entityId: student.id,
            label: 'Student → Class assignment',
            stages: ['unassigned', 'assigned'],
            required: includesAny(lower, ['assign']),
          },
        ],
        outcomes: [
          { id: 'student-created', entityId: student.id, label: 'Student record exists', required: true },
          {
            id: 'relationships-persist',
            entityId: student.id,
            label: 'Relationships persist correctly',
            required: true,
          },
        ],
      };
    }

    case 'PROJECT_MANAGEMENT_WEB_V1': {
      const project = entity('project', 'Project', 'Projects', 'Projects', true);
      return {
        contractVersion: '1.0',
        contractId: input.contractId,
        productProfile: input.profile,
        productName: 'Project Management System',
        generatedAt,
        sourcePrompt: input.rawPrompt,
        entities: [project],
        actions: [
          ...crudActions(project),
          {
            id: 'assign-project',
            entityId: project.id,
            verb: 'assign',
            label: 'Assign Project',
            required: includesAny(lower, ['assign']),
          },
        ],
        rules: [
          {
            id: 'project-name-required',
            entityId: project.id,
            label: 'Project must have a name',
            required: true,
          },
        ],
        workflows: [
          {
            id: 'project-lifecycle',
            entityId: project.id,
            label: 'Draft → In Progress → Complete',
            stages: ['draft', 'in-progress', 'complete'],
            required: true,
          },
        ],
        outcomes: [
          { id: 'project-created', entityId: project.id, label: 'Project created', required: true },
          { id: 'project-updated', entityId: project.id, label: 'Project updates persist', required: true },
        ],
      };
    }

    default:
      throw new Error(`Unsupported profile: ${input.profile satisfies never}`);
  }
}

export function buildUniversalFeatureContract(
  input: BuildUniversalFeatureContractInput,
): UniversalFeatureContract {
  const profile = input.profile ?? detectUniversalAppProfile(input.rawPrompt);
  if (!profile) {
    throw new Error('Unable to infer application profile from user idea');
  }

  const contract = buildProfileContract({
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
    profile,
  });

  if (input.requirements?.length) {
    for (const requirement of input.requirements) {
      const lower = requirement.toLowerCase();
      if (lower.includes('delete') && !contract.actions.some((action) => action.verb === 'delete')) {
        const primary = contract.entities.find((entry) => entry.primary) ?? contract.entities[0];
        contract.actions.push({
          id: `delete-${primary.id}`,
          entityId: primary.id,
          verb: 'delete',
          label: `Delete ${primary.label}`,
          required: true,
        });
      }
    }
  }

  return contract;
}

export function buildUniversalFeatureContractJson(input: BuildUniversalFeatureContractInput): string {
  return `${JSON.stringify(buildUniversalFeatureContract(input), null, 2)}\n`;
}

export function parseUniversalFeatureContract(source: string): UniversalFeatureContract {
  const parsed = JSON.parse(source) as UniversalFeatureContract;
  if (!parsed.contractVersion || !Array.isArray(parsed.entities) || !Array.isArray(parsed.actions)) {
    throw new Error('Invalid universal-feature-contract.json');
  }
  return parsed;
}

export function getPrimaryEntity(contract: UniversalFeatureContract): UniversalFeatureEntity {
  return contract.entities.find((entityRef) => entityRef.primary) ?? contract.entities[0];
}

export function computeContractCompletenessScore(contract: UniversalFeatureContract): number {
  let score = 0;
  if (contract.entities.length > 0) score += 25;
  if (contract.actions.filter((action) => action.required).length >= 3) score += 25;
  if (contract.rules.length > 0) score += 15;
  if (contract.workflows.length > 0) score += 15;
  if (contract.outcomes.length > 0) score += 20;
  return Math.min(100, score);
}
