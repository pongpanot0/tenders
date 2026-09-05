import { mockTenders } from '@/lib/mock-data';
import { PipelineBoard, PipelineCardData, PipelineStageMapping } from './PipelineBoard';

// Local stage mapping for the pipeline feature
const stageMappings: PipelineStageMapping[] = [
  {
    tenderId: 'tender-001',
    stage: 'New',
    owner: 'You',
    nextActionDate: '2026-09-10',
  },
  {
    tenderId: 'tender-002',
    stage: 'New',
    owner: 'You',
    nextActionDate: '2026-09-12',
  },
  {
    tenderId: 'tender-003',
    stage: 'Reviewing',
    owner: 'Bob',
    nextActionDate: '2026-09-18',
  },
  {
    tenderId: 'tender-007',
    stage: 'Pursuing',
    owner: 'Alice',
    nextActionDate: '2026-10-15',
  },
  {
    tenderId: 'tender-008',
    stage: 'Pursuing',
    owner: 'You',
    nextActionDate: '2026-10-01',
  },
  {
    tenderId: 'tender-010',
    stage: 'Submitted',
    owner: 'Charlie',
    nextActionDate: '2026-09-25',
  },
  {
    tenderId: 'tender-004',
    stage: 'Won',
    owner: 'Alice',
    nextActionDate: undefined,
  },
  {
    tenderId: 'tender-005',
    stage: 'Lost',
    owner: 'You',
    nextActionDate: undefined,
  },
];

// Create a map for quick lookup
const stageMap = new Map(stageMappings.map((m) => [m.tenderId, m]));

// Prepare card data for the board
const pipelineCards: PipelineCardData[] = mockTenders
  .filter((tender) => stageMap.has(tender.id))
  .map((tender) => {
    const stageMapping = stageMap.get(tender.id)!;
    return {
      id: tender.id,
      title: tender.title,
      buyerName: tender.buyerName,
      deadline: tender.deadline,
      score: tender.score,
      matchBand: tender.matchBand,
      stage: stageMapping.stage,
      owner: stageMapping.owner,
      nextActionDate: stageMapping.nextActionDate,
    };
  });

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-ink mb-2">
          Pipeline
        </h1>
        <p className="text-sm text-ink-muted">
          Track your tender opportunities through each stage of pursuit.
        </p>
      </div>

      <PipelineBoard cards={pipelineCards} />
    </div>
  );
}
