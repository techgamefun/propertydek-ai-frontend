import { apiRequest, type Property, type Unit } from "./onboarding";

export type LeaseStatus = "DRAFT" | "PENDING" | "ACTIVE" | "ENDED" | "TERMINATED";

export type Tenant = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export type LeaseDocument = {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: string | null;
  createdAt: string;
};

export type Lease = {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string | null;
  monthlyRent: string | number;
  securityDeposit: string | number;
  rentDueDay: number;
  lateFee: string | number | null;
  signedAt: string | null;
  terminatedAt: string | null;
  terms: string | null;
  tenant: Tenant;
  unit: Unit & {
    property: Pick<Property, "id" | "name"> &
      Partial<Pick<Property, "addressLine1" | "city" | "countryCode">>;
  };
  documents: LeaseDocument[];
};

export type LeaseOptions = {
  units: Array<
    Unit & {
      id: string;
      property: Pick<Property, "id" | "name">;
    }
  >;
  tenants: Tenant[];
};

export function getLeases() {
  return apiRequest<{ leases: Lease[] }>("/leases");
}

export function getLease(leaseId: string) {
  return apiRequest<{ lease: Lease }>(`/leases/${encodeURIComponent(leaseId)}`);
}

export function getLeaseOptions() {
  return apiRequest<LeaseOptions>("/leases/options");
}

export function createLease(values: {
  unitId: string;
  tenantId?: string;
  tenant?: { fullName: string; email?: string; phone?: string };
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  securityDeposit: number;
  rentDueDay: number;
  lateFee: number | null;
  terms: string;
  status: LeaseStatus;
}) {
  return apiRequest<{ lease: Lease }>("/leases", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateLease(
  leaseId: string,
  values: Partial<{
    startDate: string;
    endDate: string | null;
    monthlyRent: number;
    securityDeposit: number;
    rentDueDay: number;
    lateFee: number | null;
    terms: string | null;
    status: LeaseStatus;
  }>,
) {
  return apiRequest<{ lease: Lease }>(
    `/leases/${encodeURIComponent(leaseId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function uploadLeaseDocument(leaseId: string, file: File) {
  const body = new FormData();
  body.set("document", file);
  return apiRequest<{ document: LeaseDocument }>(
    `/leases/${encodeURIComponent(leaseId)}/documents`,
    { method: "POST", body },
  );
}

export function getLeaseDocumentDownloadUrl(leaseId: string, documentId: string) {
  return apiRequest<{ downloadUrl: string }>(
    `/leases/${encodeURIComponent(leaseId)}/documents/${encodeURIComponent(documentId)}/download`,
  );
}

export function deleteLeaseDocument(leaseId: string, documentId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/leases/${encodeURIComponent(leaseId)}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
