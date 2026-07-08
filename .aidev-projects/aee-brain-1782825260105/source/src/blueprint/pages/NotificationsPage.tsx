import { useState } from 'react';
import EmptyState from '../components/EmptyState';

interface Notice {
  id: string;
  kind: 'alert' | 'update' | 'message' | 'system';
  text: string;
  read: boolean;
  archived: boolean;
}

const SEED: Notice[] = [
  { id: 'n1', kind: 'alert', text: 'Scheduled maintenance reminder', read: false, archived: false },
  { id: 'n2', kind: 'update', text: 'New feature tips available', read: false, archived: false },
  { id: 'n3', kind: 'message', text: 'Team mention in workspace', read: true, archived: false },
  { id: 'n4', kind: 'system', text: 'Backup completed', read: true, archived: false },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>(SEED);

  const visible = items.filter((item) => !item.archived);

  return (
    <section className="blueprint-page" data-blueprint="notifications">
      <h1>Notifications</h1>
      {visible.length === 0 ? (
        <EmptyState title="Inbox clear" message="Alerts, updates, messages, and system events appear here." actionLabel="Refresh" />
      ) : (
        <ul className="blueprint-list">
          {visible.map((item) => (
            <li key={item.id} className="blueprint-list-row">
              <span className="blueprint-badge">{item.kind}</span>
              <span>{item.text}</span>
              <div className="blueprint-inline-actions">
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.map((n) => n.id === item.id ? { ...n, read: true } : n))}>Mark read</button>
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.map((n) => n.id === item.id ? { ...n, archived: true } : n))}>Archive</button>
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.filter((n) => n.id !== item.id))}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
