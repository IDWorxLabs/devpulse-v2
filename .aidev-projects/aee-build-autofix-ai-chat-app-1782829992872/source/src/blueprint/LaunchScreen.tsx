interface LaunchScreenProps {
  appName: string;
  tagline: string;
}

export default function LaunchScreen({ appName, tagline }: LaunchScreenProps) {
  return (
    <div className="blueprint-screen blueprint-launch" data-blueprint="launch-screen">
      <div className="blueprint-logo" aria-hidden="true">{appName.slice(0, 1)}</div>
      <h1>{appName}</h1>
      <p className="blueprint-tagline">{tagline}</p>
      <div className="blueprint-loading" role="status" aria-label="Loading">
        <span className="blueprint-loading-bar" />
      </div>
    </div>
  );
}
