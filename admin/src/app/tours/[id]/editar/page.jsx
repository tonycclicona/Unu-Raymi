import EditarTourClient from './EditarTourClient';

export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }) {
  return <EditarTourClient params={params} />;
}
