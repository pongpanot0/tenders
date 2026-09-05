import { RoadmapFeatures } from './RoadmapFeatures';

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-[1200px] p-8">
      <div className="mb-8">
        <h1 className="mb-3 font-display text-[28px] font-bold text-ink">
          Roadmap Preview
        </h1>
        <p className="text-sm text-ink-muted">
          Planned enhancements for future releases — lighter-fidelity
          sketches, not live features yet.
        </p>
      </div>
      <RoadmapFeatures />
    </div>
  );
}
