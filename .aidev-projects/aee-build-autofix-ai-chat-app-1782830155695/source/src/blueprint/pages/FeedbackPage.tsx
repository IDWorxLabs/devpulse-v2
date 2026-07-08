export default function FeedbackPage() {
  return (
    <section className="blueprint-page" data-blueprint="feedback">
      <h1>Feedback</h1>
      <textarea className="blueprint-input" rows={4} placeholder="Share your feedback…" />
      <div className="blueprint-actions">
        <button type="button" className="blueprint-btn blueprint-btn-primary">Send feedback</button>
        <button type="button" className="blueprint-btn">Suggest feature</button>
        <button type="button" className="blueprint-btn">Report problem</button>
      </div>
    </section>
  );
}
