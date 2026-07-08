interface AboutPageProps {
  appName: string;
}

export default function AboutPage({ appName }: AboutPageProps) {
  return (
    <section className="blueprint-page" data-blueprint="about">
      <h1>About {appName}</h1>
      <p>Generated with AiDevEngine Universal App Blueprint v1.0.</p>
    </section>
  );
}
