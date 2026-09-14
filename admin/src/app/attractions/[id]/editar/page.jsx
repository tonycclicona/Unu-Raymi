import CreateAttractionPage from '../../create/page';

export async function generateStaticParams() {
  return Array.from({ length: 200 }, (_, i) => ({ id: String(i + 1) }));
}

export default function EditarAttractionPage() {
  return <CreateAttractionPage />;
}
