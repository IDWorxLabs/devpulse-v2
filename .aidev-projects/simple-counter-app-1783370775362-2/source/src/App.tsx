import CounterFeature from './features/counter';

export default function App() {
  return (
    <main data-simple-utility-app="counter" data-root-feature="counter" data-feature-module="counter">
      <CounterFeature />
    </main>
  );
}
