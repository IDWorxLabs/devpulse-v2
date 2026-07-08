interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  fallbackLabel?: string;
  onFallback?: () => void;
}

export default function ErrorState({ message, onRetry, fallbackLabel = 'Go home', onFallback }: ErrorStateProps) {
  return (
    <div className="blueprint-error" data-blueprint="error-state" role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <div className="blueprint-actions">
        <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={onRetry}>Retry</button>
        <button type="button" className="blueprint-btn" onClick={onFallback}>{fallbackLabel}</button>
      </div>
    </div>
  );
}
