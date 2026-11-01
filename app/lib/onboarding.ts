import { notifyToast } from "./toast";

export type SetupMethod = "fresh" | "import" | "demo";
export type MembershipRole =
  | "ADMIN"
  | "PROPERTY_MANAGER"
  | "ACCOUNTANT"
  | "MAINTENANCE"
  | "VIEWER";

export type Organization = {
  id: string;
  name: string;
  countryCode: string | null;
  timezone: string | null;
  setupMethod: string | null;
  onboardingCompleted: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingStatus = {
  organization: Organization | null;
  currentStep: "workspace" | "setup" | "property" | "team" | "complete";
  completed: boolean;
  steps: {
    workspace: boolean;
    setupMethod: boolean;
    property: boolean;
    team: boolean;
  };
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string };
};

export class ApiRequestError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

let refreshRequest: Promise<boolean> | null = null;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD";
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    try {
      const request = () => fetch(`/api/v1${path}`, {
        ...init,
        signal: controller.signal,
        credentials: "same-origin",
        headers: {
          ...(init.body && !(init.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...init.headers,
        },
      });
      response = await request();
      if (response.status === 401 && (await refreshAccessToken())) {
        response = await request();
      }
    } catch {
      if (controller.signal.aborted && !init.signal?.aborted) {
        throw new ApiRequestError(
          "The server took too long to respond. Please retry in a moment.",
        );
      }
      throw new ApiRequestError(
        "We couldn't connect to PropertyDek. Check your connection and try again.",
      );
    }

    let result: ApiResponse<T>;
    try {
      result = (await response.json()) as ApiResponse<T>;
    } catch {
      if (controller.signal.aborted && !init.signal?.aborted) {
        throw new ApiRequestError(
          "The server took too long to respond. Please retry in a moment.",
        );
      }
      throw new ApiRequestError("The server returned an unreadable response.");
    }
    if (!response.ok || !result.success || result.data === undefined) {
      throw new ApiRequestError(
        result.error?.message ?? "The request could not be completed.",
        response.status,
      );
    }
    if (isMutation) {
      notifyToast("success", getSuccessMessage(method, path));
    }
    return result.data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (isMutation) {
        notifyToast("error", error.message);
      }
      throw error;
    }
    const requestError = new ApiRequestError("The request could not be completed.");
    if (isMutation) {
      notifyToast("error", requestError.message);
    }
    throw requestError;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }
}

function getSuccessMessage(method: string, path: string) {
  if (method === "DELETE") {
    return "Deleted successfully.";
  }
  if (method === "PATCH" || method === "PUT") {
    return "Changes saved successfully.";
  }
  if (path.includes("/payments")) {
    return "Payment recorded successfully.";
  }
  if (path.includes("/assignments")) {
    return "Assignment updated successfully.";
  }
  if (path.includes("/comments")) {
    return "Comment added successfully.";
  }
  if (path.includes("/documents")) {
    return "Document uploaded successfully.";
  }
  if (path.includes("/invitations")) {
    return "Invitation sent successfully.";
  }
  if (path.includes("/demo-data")) {
    return "Sample data created successfully.";
  }
  if (path.includes("/properties")) {
    return "Property saved successfully.";
  }
  if (path.includes("/tenants")) {
    return "Tenant saved successfully.";
  }
  if (path.includes("/leases")) {
    return "Lease saved successfully.";
  }
  if (path.includes("/invoices")) {
    return "Invoice saved successfully.";
  }
  if (path.includes("/maintenance")) {
    return "Maintenance request saved successfully.";
  }
  return "Changes saved successfully.";
}

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export function getOnboardingStatus() {
  return apiRequest<OnboardingStatus>("/onboarding/status");
}

export function createOrganization(values: {
  name: string;
  countryCode: string;
  timezone: string;
}) {
  return apiRequest<{ organization: Organization }>("/organizations", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateOrganization(
  organizationId: string,
  values: { name: string; countryCode: string; timezone: string },
) {
  return apiRequest<{ organization: Organization }>(
    `/organizations/${encodeURIComponent(organizationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function saveSetupMethod(method: SetupMethod) {
  return apiRequest<{ organization: Organization }>("/onboarding/setup-method", {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

export function createDemoData() {
  return apiRequest<{ property: Property; created: boolean }>("/onboarding/demo-data", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type Property = {
  id: string;
  name: string;
  type: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  timezone?: string | null;
  description?: string | null;
  _count?: { units: number };
  units?: Unit[];
  documents?: PropertyDocument[];
};

export type PropertyDocument = {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: string | null;
  createdAt: string;
  uploadedBy: { id: string; fullName: string } | null;
};

export type Unit = {
  id: string;
  unitNumber: string;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  monthlyRent: number | string;
  status: string;
};

export function createProperty(values: {
  name: string;
  type: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
}) {
  return apiRequest<{ property: Property }>("/properties", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateProperty(
  propertyId: string,
  values: {
    name: string;
    type: string;
    addressLine1: string;
    city: string;
    region: string;
    postalCode: string;
  },
) {
  return apiRequest<{ property: Property }>(
    `/properties/${encodeURIComponent(propertyId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function getPropertyById(propertyId: string) {
  return apiRequest<{ property: Property }>(
    `/properties/${encodeURIComponent(propertyId)}`,
  );
}

export function uploadPropertyDocument(propertyId: string, file: File) {
  const body = new FormData();
  body.set("document", file);
  return apiRequest<{ document: PropertyDocument }>(
    `/properties/${encodeURIComponent(propertyId)}/documents`,
    { method: "POST", body },
    60_000,
  );
}

export function getPropertyDocumentDownloadUrl(propertyId: string, documentId: string) {
  return apiRequest<{ downloadUrl: string }>(
    `/properties/${encodeURIComponent(propertyId)}/documents/${encodeURIComponent(documentId)}/download`,
  );
}

export function deletePropertyDocument(propertyId: string, documentId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/properties/${encodeURIComponent(propertyId)}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}

export function getPropertyUnits(propertyId: string) {
  return apiRequest<{ units: Unit[] }>(
    `/properties/${encodeURIComponent(propertyId)}/units`,
  );
}

export function createUnit(
  propertyId: string,
  values: {
    unitNumber: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    monthlyRent: number;
    status: string;
  },
) {
  return apiRequest<{ unit: Unit }>(
    `/properties/${encodeURIComponent(propertyId)}/units`,
    {
      method: "POST",
      body: JSON.stringify(values),
    },
  );
}

export function createUnitsBulk(
  propertyId: string,
  units: Array<{
    unitNumber: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    monthlyRent: number;
    status: string;
  }>,
) {
  return apiRequest<{ units: Unit[]; count: number }>(
    `/properties/${encodeURIComponent(propertyId)}/units/bulk`,
    {
      method: "POST",
      body: JSON.stringify({ units }),
    },
  );
}

export function completeTeamStep(action: "completed" | "skipped") {
  return apiRequest<{ organization: Organization }>("/onboarding/complete-step", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function completeOnboarding() {
  return apiRequest<{ organization: Organization }>("/onboarding/complete", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type Invitation = {
  id: string;
  email: string;
  role: MembershipRole;
  status: string;
  expiresAt: string;
  acceptedAt?: string | null;
};

export function createInvitations(
  organizationId: string,
  invitations: Array<{ email: string; role: MembershipRole }>,
) {
  return apiRequest<{
    invitations: Array<{
      id: string;
      email: string;
      role: MembershipRole;
      token: string;
      expiresAt: string;
    }>;
  }>(`/organizations/${encodeURIComponent(organizationId)}/invitations`, {
    method: "POST",
    body: JSON.stringify({ invitations }),
  });
}

export function listInvitations(organizationId: string) {
  return apiRequest<{ invitations: Invitation[] }>(
    `/organizations/${encodeURIComponent(organizationId)}/invitations`,
  );
}

export function cancelInvitation(organizationId: string, invitationId: string) {
  return apiRequest<{ canceled: boolean }>(
    `/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
  );
}

export function createImport(fileName: string) {
  return apiRequest<{
    import: {
      id: string;
      fileName: string;
      status: string;
    };
  }>("/imports", {
    method: "POST",
    body: JSON.stringify({ fileName }),
  });
}

export function getImport(importId: string) {
  return apiRequest<{
    import: { id: string; fileName: string; status: string; result: unknown };
  }>(`/imports/${encodeURIComponent(importId)}`);
}
export function acceptInvitation(token: string) {
  return apiRequest<{ membership: { role: string } }>("/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function getDashboardOverview() {
  return apiRequest<{
    workspace: Organization;
    properties: Property[];
    tasks: Array<{ id: string; title: string; completed: boolean }>;
    metrics: {
      properties: number;
      units: number;
      occupiedUnits: number;
      occupancyRate: number;
      activeLeases: number;
      openMaintenance: number;
      collectedPayments: Array<{
        currency: string;
        amount: number | string;
      }>;
      paymentTrend: Array<{
        month: string;
        currency: string;
        amount: number | string;
      }>;
    };
  }>("/dashboard/overview");
}

export function getGettingStarted() {
  return apiRequest<{
    tasks: Array<{ id: string; title: string; completed: boolean }>;
  }>("/dashboard/getting-started");
}

export function getCurrentOrganization() {
  return apiRequest<{ organization: Organization; role: string }>(
    "/organizations/current",
  );
}

export function getCurrentUser() {
  return apiRequest<{ user: UserProfile }>("/users/me");
}

export function updateCurrentUser(values: {
  fullName: string;
  phone: string;
}, avatarFile?: File | null) {
  let body: BodyInit;
  if (avatarFile) {
    const formData = new FormData();
    formData.set("fullName", values.fullName);
    formData.set("phone", values.phone);
    formData.set("avatar", avatarFile);
    body = formData;
  } else {
    body = JSON.stringify(values);
  }
  return apiRequest<{ user: UserProfile }>("/users/me", {
    method: "PATCH",
    body,
  });
}

export function removeCurrentUserAvatar() {
  return apiRequest<{ user: UserProfile }>("/users/me/avatar", {
    method: "DELETE",
  });
}

export function getProperties() {
  return apiRequest<{ properties: Property[] }>("/properties");
}
