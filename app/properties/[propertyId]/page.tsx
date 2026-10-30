import { Suspense } from "react";
import PropertyDetailClient from "./PropertyDetailClient";
import WorkspaceShell from "../../components/WorkspaceShell";

export default function PropertyDetailPage() {
  return (
    <WorkspaceShell>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[#68756f]">
            Loading property...
          </main>
        }
      >
        <PropertyDetailClient />
      </Suspense>
    </WorkspaceShell>
  );
}
