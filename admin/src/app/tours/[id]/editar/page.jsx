import EditarTourClient from './EditarTourClient';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }) {
  return <EditarTourClient params={params} />;
}
