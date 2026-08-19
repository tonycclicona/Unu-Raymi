import EditarGuiaClient from './EditarGuiaClient';

export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }) {
  return <EditarGuiaClient params={params} />;
}
