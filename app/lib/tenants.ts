import { apiRequest } from "./onboarding";

export type Tenant = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantListItem = Tenant & {
  _count: { leases: number; maintenanceRequests: number };
};

export type TenantLease = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: string | number;
  unit: {
    id: string;
    unitNumber: string;
    property: { id: string; name: string; addressLine1: string; city: string };
  };
};

export type TenantMaintenanceRequest = {
  id: string;
  title: string;
  status: string;
  priority: string;
  requestedAt: string;
  property: { id: string; name: string };
  unit: { id: string; unitNumber: string } | null;
};

export type TenantDetails = Tenant & {
  leases: TenantLease[];
  maintenanceRequests: TenantMaintenanceRequest[];
};

export type TenantValues = {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
};

export function getTenants(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<{ tenants: TenantListItem[] }>(`/tenants${query}`);
}

export function getTenant(tenantId: string) {
  return apiRequest<{ tenant: TenantDetails }>(
    `/tenants/${encodeURIComponent(tenantId)}`,
  );
}

export function createTenant(values: TenantValues) {
  return apiRequest<{ tenant: Tenant }>("/tenants", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateTenant(tenantId: string, values: TenantValues) {
  return apiRequest<{ tenant: Tenant }>(
    `/tenants/${encodeURIComponent(tenantId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function deleteTenant(tenantId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/tenants/${encodeURIComponent(tenantId)}`,
    { method: "DELETE" },
  );
}
