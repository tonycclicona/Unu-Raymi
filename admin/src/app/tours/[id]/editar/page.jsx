import EditarTourClient from './EditarTourClient';

export async function generateStaticParams() {
  return Array.from({ length: 200 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page({ params }) {
  return <EditarTourClient params={params} />;
}

