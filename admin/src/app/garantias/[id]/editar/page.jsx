import EditarGarantiaClient from './EditarGarantiaClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }) {
  return <EditarGarantiaClient params={params} />;
}
