import { Suspense } from "react";
import InvoiceDetailClient from "./InvoiceDetailClient";

export default function InvoiceDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading invoice...
        </main>
      }
    >
      <InvoiceDetailClient />
    </Suspense>
  );
}
