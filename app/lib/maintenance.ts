import { apiRequest } from "./onboarding";

export type MaintenanceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MaintenanceProperty = {
  id: string;
  name: string;
  units: Array<{ id: string; unitNumber: string; status: string }>;
};

export type MaintenanceTechnician = {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  specialties: string[];
};

export type MaintenanceAssignment = {
  id: string;
  status: string;
  assignedAt: string;
  technician: MaintenanceTechnician;
};

export type MaintenanceComment = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  authorUser: { id: string; fullName: string } | null;
  authorTenant: { id: string; fullName: string } | null;
};

export type MaintenanceDocument = {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: string | null;
  createdAt: string;
  uploadedBy: { id: string; fullName: string } | null;
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  requestedAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
  property: { id: string; name: string };
  unit: { id: string; unitNumber: string } | null;
  tenant: { id: string; fullName: string } | null;
  assignments: MaintenanceAssignment[];
  comments?: MaintenanceComment[];
  documents?: MaintenanceDocument[];
  _count?: { comments: number };
};

export function getMaintenanceRequests(filters: {
  status?: MaintenanceStatus | "ALL";
  priority?: MaintenancePriority | "ALL";
  propertyId?: string;
}) {
  const query = new URLSearchParams();
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
  if (filters.priority && filters.priority !== "ALL") query.set("priority", filters.priority);
  if (filters.propertyId && filters.propertyId !== "ALL") {
    query.set("propertyId", filters.propertyId);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<{ requests: MaintenanceRequest[] }>(`/maintenance${suffix}`);
}

export function getMaintenanceOptions() {
  return apiRequest<{
    properties: MaintenanceProperty[];
    technicians: MaintenanceTechnician[];
  }>("/maintenance/options");
}

export function getMaintenanceRequest(requestId: string) {
  return apiRequest<{ request: MaintenanceRequest }>(
    `/maintenance/${encodeURIComponent(requestId)}`,
  );
}

export function createMaintenanceRequest(values: {
  propertyId: string;
  unitId: string | null;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  scheduledAt: string | null;
}) {
  return apiRequest<{ request: MaintenanceRequest }>("/maintenance", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateMaintenanceRequest(
  requestId: string,
  values: Partial<{
    title: string;
    description: string;
    category: string | null;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    scheduledAt: string | null;
  }>,
) {
  return apiRequest<{ request: MaintenanceRequest }>(
    `/maintenance/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify(values) },
  );
}

export function addMaintenanceComment(requestId: string, body: string) {
  return apiRequest<{ comment: MaintenanceComment }>(
    `/maintenance/${encodeURIComponent(requestId)}/comments`,
    { method: "POST", body: JSON.stringify({ body }) },
  );
}

export function assignMaintenanceTechnician(requestId: string, technicianId: string) {
  return apiRequest<{ assignment: MaintenanceAssignment }>(
    `/maintenance/${encodeURIComponent(requestId)}/assignments`,
    { method: "POST", body: JSON.stringify({ technicianId }) },
  );
}

export function unassignMaintenanceTechnician(requestId: string, assignmentId: string) {
  return apiRequest<{ removed: boolean }>(
    `/maintenance/${encodeURIComponent(requestId)}/assignments/${encodeURIComponent(assignmentId)}`,
    { method: "DELETE" },
  );
}

export function createMaintenanceTechnician(values: {
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
}) {
  return apiRequest<{ technician: MaintenanceTechnician }>("/maintenance/technicians", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function uploadMaintenanceDocument(requestId: string, file: File) {
  const body = new FormData();
  body.set("document", file);
  return apiRequest<{ document: MaintenanceDocument }>(
    `/maintenance/${encodeURIComponent(requestId)}/documents`,
    { method: "POST", body },
  );
}

export function getMaintenanceDocumentDownloadUrl(requestId: string, documentId: string) {
  return apiRequest<{ downloadUrl: string }>(
    `/maintenance/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(documentId)}/download`,
  );
}

export function deleteMaintenanceDocument(requestId: string, documentId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/maintenance/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
