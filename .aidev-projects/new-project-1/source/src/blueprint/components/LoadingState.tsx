interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="blueprint-loading-state" data-blueprint="loading-state" role="status">
      <div className="blueprint-skeleton blueprint-skeleton-lg" />
      <div className="blueprint-skeleton" />
      <div className="blueprint-skeleton" />
      <progress max={100} value={60} />
      <p>{message}</p>
    </div>
  );
}
