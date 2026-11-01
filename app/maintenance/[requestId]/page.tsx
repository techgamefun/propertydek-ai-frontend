import { Suspense } from "react";
import MaintenanceDetailClient from "./MaintenanceDetailClient";

export default function MaintenanceRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading maintenance request...
        </main>
      }
    >
      <MaintenanceDetailClient params={params} />
    </Suspense>
  );
}
