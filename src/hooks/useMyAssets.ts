import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          asset_tag,
          name,
          brand,
          model,
          serial_number,
          condition,
          status,
          image_url,
          assigned_date,
          category:asset_categories(id, name, icon)
        `)
        .eq('assigned_to', employee.id)
        .eq('status', 'assigned');

      if (error) throw error;
      return data as MyAsset[];
    },
    enabled: !!employee?.id,
  });
}
