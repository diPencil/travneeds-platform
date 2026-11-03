import { HotelEditPageContent } from './content';

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HotelEditPageContent hotelId={decodeURIComponent(id)} />;
}
