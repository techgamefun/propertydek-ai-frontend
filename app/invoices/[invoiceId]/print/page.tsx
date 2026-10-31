import { Suspense } from "react";
import InvoicePrintClient from "./InvoicePrintClient";

export default function InvoicePrintPage() {
  return (
    <Suspense
      fallback={<main className="p-8 text-sm text-[#68756f]">Preparing invoice...</main>}
    >
      <InvoicePrintClient />
    </Suspense>
  );
}
