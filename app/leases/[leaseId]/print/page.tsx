import { Suspense } from "react";
import LeasePrintClient from "./LeasePrintClient";

export default function LeasePrintPage() {
  return (
    <Suspense
      fallback={<main className="p-8 text-sm text-[#68756f]">Preparing lease summary...</main>}
    >
      <LeasePrintClient />
    </Suspense>
  );
}
