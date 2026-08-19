import EditarGarantiaClient from './EditarGarantiaClient';

export async function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page({ params }) {
  return <EditarGarantiaClient params={params} />;
}

