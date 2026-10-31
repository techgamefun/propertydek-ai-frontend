import { Suspense } from "react";
import LeaseDetailClient from "./LeaseDetailClient";

export default function LeaseDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading lease...
        </main>
      }
    >
      <LeaseDetailClient />
    </Suspense>
  );
}
