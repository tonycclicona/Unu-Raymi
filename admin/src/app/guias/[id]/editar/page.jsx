import EditarGuiaClient from './EditarGuiaClient';

export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page({ params }) {
  return <EditarGuiaClient params={params} />;
}

