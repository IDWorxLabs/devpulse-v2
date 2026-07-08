import EmptyState from '../components/EmptyState';

const FILTERS = ['Content', 'Modules', 'People', 'Messages', 'App data'];

export default function SearchPage() {
  return (
    <section className="blueprint-page" data-blueprint="search">
      <h1>Search</h1>
      <input className="blueprint-input" type="search" placeholder="Search everything…" aria-label="Global search" />
      <div className="blueprint-chip-row">
        {FILTERS.map((filter) => (
          <span key={filter} className="blueprint-chip">{filter}</span>
        ))}
      </div>
      <EmptyState title="No results yet" message="Try a query to find content, modules, people, or messages." actionLabel="Clear filters" />
    </section>
  );
}
