/**
 * Universal CRUD Generation Engine V1 — UI + handler code generation.
 */

import type { UniversalCrudEntityGenerationInput } from './universal-crud-types.js';
import { escTsString, moduleIdToPascalCase } from './universal-crud-types.js';

export function generateCrudUiHandlerSource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor, appTitle, promptTerms } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  const displayName = descriptor.displayName;

  return `import { useEffect, useState, type FormEvent } from 'react';
import { use${pascal}CrudRuntime } from './${descriptor.entityId}.runtime-state';
import { ${descriptor.entityKey.toUpperCase()}_CRUD_VALIDATION } from './${descriptor.entityId}.validation';
import './${descriptor.entityId}.module.css';

export default function ${pascal}Feature() {
  const crud = use${pascal}CrudRuntime(10);
  const [createLabel, setCreateLabel] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    crud.refresh();
  }, [crud.search, crud.page, crud.sortField, crud.sortDirection]);

  const onCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    crud.create({ label: createLabel });
    setCreateLabel('');
  };

  const onEditSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editId) return;
    crud.update(editId, { label: editLabel });
    setEditId(null);
    setEditLabel('');
  };

  const startEdit = (id: string, label: string) => {
    setEditId(id);
    setEditLabel(label);
  };

  const totalPages = Math.max(1, Math.ceil(crud.total / crud.pageSize));

  return (
    <section
      className="modular-feature universal-crud-feature"
      data-feature-module="${descriptor.entityId}"
      data-universal-crud-engine="v1"
      data-modular-feature-v1="true"
      data-interaction-control="true"
      data-prompt-terms="${escTsString(promptTerms.join(','))}"
    >
      <header className="modular-feature-header">
        <h2>${escTsString(displayName)}</h2>
        <p>${escTsString(appTitle)} — universal entity management</p>
      </header>

      <div className="universal-crud-toolbar">
        <button type="button" data-interaction-control="true" className="universal-crud-btn" onClick={() => crud.refresh()}>
          Refresh
        </button>
        {crud.undoSnapshot ? (
          <button type="button" data-interaction-control="true" className="universal-crud-btn" onClick={() => crud.undoDelete()}>
            Undo delete
          </button>
        ) : null}
        <span className="universal-crud-meta">Total: {crud.total}</span>
      </div>

      {crud.loading ? <p className="universal-crud-status" data-loading="true">Loading…</p> : null}
      {crud.error ? <p className="universal-crud-status universal-crud-error" data-error="true">{crud.error}</p> : null}
      {crud.success ? <p className="universal-crud-status universal-crud-success" data-success="true">{crud.success}</p> : null}

      <form className="universal-crud-form" onSubmit={onCreateSubmit}>
        <label htmlFor="${descriptor.entityId}-create-label">Create ${escTsString(displayName)}</label>
        <input
          id="${descriptor.entityId}-create-label"
          data-interaction-control="true"
          value={createLabel}
          onChange={(e) => setCreateLabel(e.target.value)}
          placeholder="Enter label"
        />
        <button type="submit" data-interaction-control="true" className="universal-crud-btn universal-crud-btn-primary">
          Create
        </button>
      </form>

      <div className="universal-crud-filters">
        <input
          data-interaction-control="true"
          type="search"
          placeholder="Search…"
          value={crud.search}
          onChange={(e) => crud.setSearch(e.target.value)}
        />
        <select
          data-interaction-control="true"
          value={\`\${crud.sortField}:\${crud.sortDirection}\`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(':') as ['label' | 'createdAt' | 'updatedAt', 'asc' | 'desc'];
            crud.setSort(field, direction);
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="label:asc">Label A–Z</option>
          <option value="label:desc">Label Z–A</option>
        </select>
      </div>

      {editId ? (
        <form className="universal-crud-form" onSubmit={onEditSubmit}>
          <label htmlFor="${descriptor.entityId}-edit-label">Edit record</label>
          <input
            id="${descriptor.entityId}-edit-label"
            data-interaction-control="true"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
          />
          <button type="submit" data-interaction-control="true" className="universal-crud-btn">Save</button>
          <button type="button" data-interaction-control="true" className="universal-crud-btn" onClick={() => setEditId(null)}>
            Cancel
          </button>
        </form>
      ) : null}

      {crud.pendingDeleteId ? (
        <div className="universal-crud-confirm" data-delete-confirm="true">
          <p>Delete this record?</p>
          <button type="button" data-interaction-control="true" className="universal-crud-btn universal-crud-btn-danger" onClick={() => crud.confirmDelete()}>
            Confirm delete
          </button>
          <button type="button" data-interaction-control="true" className="universal-crud-btn" onClick={() => crud.cancelDelete()}>
            Cancel
          </button>
        </div>
      ) : null}

      {crud.items.length === 0 && !crud.loading ? (
        <p className="modular-feature-empty-state" data-empty-state="true">No ${escTsString(displayName)} recorded yet.</p>
      ) : (
        <ul className="modular-feature-records universal-crud-records">
          {crud.items.map((record) => (
            <li key={record.id} className="universal-crud-record">
              <label>
                <input
                  type="checkbox"
                  data-interaction-control="true"
                  checked={crud.selectedIds.includes(record.id)}
                  onChange={() => crud.toggleSelection(record.id)}
                />
                {record.label}
              </label>
              <div className="universal-crud-record-actions">
                <button type="button" data-interaction-control="true" className="universal-crud-btn" onClick={() => startEdit(record.id, record.label)}>
                  Edit
                </button>
                <button type="button" data-interaction-control="true" className="universal-crud-btn universal-crud-btn-danger" onClick={() => crud.requestDelete(record.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="universal-crud-pagination">
        <button type="button" data-interaction-control="true" disabled={crud.page <= 1} onClick={() => crud.setPage(crud.page - 1)}>
          Previous
        </button>
        <span>Page {crud.page} of {totalPages}</span>
        <button type="button" data-interaction-control="true" disabled={crud.page >= totalPages} onClick={() => crud.setPage(crud.page + 1)}>
          Next
        </button>
      </div>

      <p data-validation-rules={${descriptor.entityKey.toUpperCase()}_CRUD_VALIDATION.rules.length}>
        Validation rules: {${descriptor.entityKey.toUpperCase()}_CRUD_VALIDATION.rules.length}
      </p>
    </section>
  );
}
`;
}

export function generateCrudModuleCss(descriptor: { entityId: string }): string {
  return `.modular-feature[data-feature-module="${descriptor.entityId}"] { width: 100%; }
.universal-crud-feature .modular-feature-header h2 { margin: 0 0 0.35rem; }
.universal-crud-toolbar, .universal-crud-filters, .universal-crud-pagination { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin: 0.75rem 0; }
.universal-crud-form { display: grid; gap: 0.5rem; margin: 0.75rem 0; max-width: 420px; }
.universal-crud-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 0.35rem 0.75rem; cursor: pointer; }
.universal-crud-btn-primary { background: #2563eb; color: #fff; border-color: transparent; }
.universal-crud-btn-danger { background: #dc2626; color: #fff; border-color: transparent; }
.universal-crud-records { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
.universal-crud-record { display: flex; justify-content: space-between; gap: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.75rem; }
.universal-crud-record-actions { display: flex; gap: 0.35rem; }
.universal-crud-error { color: #dc2626; }
.universal-crud-success { color: #16a34a; }
.universal-crud-confirm { background: #fef2f2; border: 1px solid #fecaca; padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0; }
`;
}

export function generateCrudIndexSource(descriptor: { entityId: string }): string {
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  return `export { default } from './${pascal}Feature';
export * from './${descriptor.entityId}.types';
export * from './${descriptor.entityId}.repository';
export * from './${descriptor.entityId}.service';
export * from './${descriptor.entityId}.validation';
export * from './${descriptor.entityId}.runtime-state';
`;
}
