import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Store {
  id: string;
  name: string;
  code: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
  };
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  employee_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StoreAssignment {
  id: string;
  employee_id: string;
  store_id: string;
  is_primary: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
    phone?: string;
    status: string;
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
  store?: Store;
}

export interface CreateStoreInput {
  name: string;
  code: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  opening_time?: string;
  closing_time?: string;
  is_active?: boolean;
}

export interface AssignEmployeeInput {
  employee_id: string;
  is_primary?: boolean;
  start_date?: string;
  end_date?: string;
}

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      return api.get<Store[]>("/stores");
    },
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: async () => {
      return api.get<Store>(`/stores/${id}`);
    },
    enabled: !!id,
  });
}

export function useStoreEmployees(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "employees"],
    queryFn: async () => {
      return api.get<StoreAssignment[]>(`/stores/${storeId}/employees`);
    },
    enabled: !!storeId,
  });
}

export function useMyStores() {
  return useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      return api.get<StoreAssignment[]>("/stores/my-stores");
    },
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (store: CreateStoreInput) => {
      return api.post<Store>("/stores", store);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create store: ${error.message}`);
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...store }: CreateStoreInput & { id: string }) => {
      return api.put<Store>(`/stores/${id}`, store);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
      toast.success("Store updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update store: ${error.message}`);
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete store: ${error.message}`);
    },
  });
}

export function useAssignEmployeeToStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, ...data }: AssignEmployeeInput & { storeId: string }) => {
      return api.post<StoreAssignment>(`/stores/${storeId}/assignments`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.storeId, "employees"] });
      toast.success("Employee assigned to store");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign employee: ${error.message}`);
    },
  });
}

export function useRemoveEmployeeFromStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, employeeId }: { storeId: string; employeeId: string }) => {
      return api.delete(`/stores/${storeId}/assignments/${employeeId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.storeId, "employees"] });
      toast.success("Employee removed from store");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove employee: ${error.message}`);
    },
  });
}
