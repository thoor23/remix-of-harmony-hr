import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { 
  Location, 
  LocationType, 
  LocationAssignment, 
  CreateLocationInput, 
  AssignEmployeeInput,
  EmployeeTransfer,
  CreateTransferInput 
} from "@/types/location";

// Re-export types for convenience
export type { Location, LocationType, LocationAssignment, CreateLocationInput, AssignEmployeeInput, EmployeeTransfer, CreateTransferInput };

// Main hook with type filter
export function useLocations(type?: LocationType) {
  return useQuery({
    queryKey: ["locations", type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      return api.get<Location[]>(`/stores${params}`);
    },
  });
}

// Convenience wrappers
export function useStores() {
  return useLocations('store');
}

export function useOffices() {
  return useLocations('office');
}

export function useAllLocations() {
  return useLocations();
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: async () => {
      return api.get<Location>(`/stores/${id}`);
    },
    enabled: !!id,
  });
}

export function useLocationEmployees(locationId: string) {
  return useQuery({
    queryKey: ["locations", locationId, "employees"],
    queryFn: async () => {
      return api.get<LocationAssignment[]>(`/stores/${locationId}/employees`);
    },
    enabled: !!locationId,
  });
}

export function useMyLocations() {
  return useQuery({
    queryKey: ["my-locations"],
    queryFn: async () => {
      return api.get<LocationAssignment[]>("/stores/my-stores");
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: CreateLocationInput) => {
      return api.post<Location>("/stores", location);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      const typeName = variables.type === 'office' ? 'Office' : 'Store';
      toast.success(`${typeName} created successfully`);
    },
    onError: (error: Error, variables) => {
      const typeName = variables.type === 'office' ? 'office' : 'store';
      toast.error(`Failed to create ${typeName}: ${error.message}`);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...location }: CreateLocationInput & { id: string }) => {
      return api.put<Location>(`/stores/${id}`, location);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.id] });
      const typeName = data.type === 'office' ? 'Office' : 'Store';
      toast.success(`${typeName} updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

export function useAssignEmployeeToLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, ...data }: AssignEmployeeInput & { locationId: string }) => {
      return api.post<LocationAssignment>(`/stores/${locationId}/assignments`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.locationId, "employees"] });
      toast.success("Employee assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign employee: ${error.message}`);
    },
  });
}

export function useRemoveEmployeeFromLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, employeeId }: { locationId: string; employeeId: string }) => {
      return api.delete(`/stores/${locationId}/assignments/${employeeId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.locationId, "employees"] });
      toast.success("Employee removed from location");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove employee: ${error.message}`);
    },
  });
}

export function useEmployeeTransfers(employeeId?: string, locationId?: string) {
  return useQuery({
    queryKey: ["employee-transfers", { employeeId, locationId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (locationId) params.append("store_id", locationId);
      const queryString = params.toString();
      return api.get<EmployeeTransfer[]>(`/stores/transfers${queryString ? `?${queryString}` : ""}`);
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransferInput) => {
      return api.post<EmployeeTransfer>("/stores/transfers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee transferred successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to transfer employee: ${error.message}`);
    },
  });
}
