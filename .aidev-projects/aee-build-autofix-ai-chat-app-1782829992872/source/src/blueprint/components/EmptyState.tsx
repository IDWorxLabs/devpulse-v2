interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction?: () => void;
}

export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="blueprint-empty" data-blueprint="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={onAction}>{actionLabel}</button>
    </div>
  );
}
