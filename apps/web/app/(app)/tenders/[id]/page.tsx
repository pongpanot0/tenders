import { notFound } from 'next/navigation';
import { mockTenders } from '@/lib/mock-data';
import { TenderDetail } from './TenderDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TenderPage({ params }: Props) {
  const { id } = await params;
  const tender = mockTenders.find((t) => t.id === id);

  if (!tender) {
    notFound();
  }

  return <TenderDetail tender={tender} />;
}
