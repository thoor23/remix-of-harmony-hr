import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCurrentEmployee } from './useCurrentEmployee';

interface MyAsset {
  id: string;
  asset_tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  condition: string | null;
  status: string;
  image_url: string | null;
  assigned_date: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
}

export function useMyAssets() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ['my-assets', employee?.id],
    queryFn: () => api.get<MyAsset[]>('/assets/my'),
    enabled: !!employee?.id,
  });
}
