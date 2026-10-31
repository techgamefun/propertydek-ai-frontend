import { apiRequest } from "./onboarding";
import type { LeaseStatus, Tenant } from "./leases";

export type InvoiceStatus =
  | "DRAFT"
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "CHECK" | "OTHER";

export type InvoicePayment = {
  id: string;
  amount: string | number;
  currency: string;
  method: PaymentMethod;
  status: string;
  provider: string | null;
  paidAt: string | null;
  notes: string | null;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  issuedAt: string | null;
  dueAt: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  currency: string;
  status: InvoiceStatus;
  paidAt: string | null;
  amountPaid: string | number;
  balanceDue: string | number;
  lease: {
    id: string;
    status: LeaseStatus;
    monthlyRent: string | number;
    rentDueDay: number;
    tenant: Tenant;
    unit: {
      unitNumber: string;
      property: { id: string; name: string };
    };
  };
  payments: InvoicePayment[];
};

export type InvoiceLeaseOption = {
  id: string;
  monthlyRent: string | number;
  rentDueDay: number;
  tenant: Tenant;
  unit: {
    unitNumber: string;
    property: { id: string; name: string };
  };
};

export function getInvoices(status?: InvoiceStatus | "ALL") {
  const query = status && status !== "ALL" ? `?status=${status}` : "";
  return apiRequest<{ invoices: Invoice[] }>(`/invoices${query}`);
}

export function getInvoice(invoiceId: string) {
  return apiRequest<{ invoice: Invoice }>(
    `/invoices/${encodeURIComponent(invoiceId)}`,
  );
}

export function getInvoiceOptions() {
  return apiRequest<{ leases: InvoiceLeaseOption[] }>("/invoices/options");
}

export function createInvoice(values: {
  leaseId: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}) {
  return apiRequest<{ invoice: Invoice }>("/invoices", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateInvoice(
  invoiceId: string,
  values: Partial<{
    description: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    dueAt: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    status: InvoiceStatus;
  }>,
) {
  return apiRequest<{ invoice: Invoice }>(
    `/invoices/${encodeURIComponent(invoiceId)}`,
    { method: "PATCH", body: JSON.stringify(values) },
  );
}

export function recordInvoicePayment(
  invoiceId: string,
  values: { amount: number; method: PaymentMethod; notes: string },
) {
  return apiRequest<{ invoice: Invoice; payment: InvoicePayment }>(
    `/invoices/${encodeURIComponent(invoiceId)}/payments`,
    { method: "POST", body: JSON.stringify(values) },
  );
}

export function refundInvoicePayment(
  invoiceId: string,
  paymentId: string,
  reason: string,
) {
  return apiRequest<{ invoice: Invoice; payment: InvoicePayment }>(
    `/invoices/${encodeURIComponent(invoiceId)}/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}
