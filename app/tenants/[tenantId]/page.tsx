import { Suspense } from "react";
import TenantDetailClient from "./TenantDetailClient";
import WorkspaceShell from "../../components/WorkspaceShell";

export default function TenantDetailPage() {
  return (
    <WorkspaceShell>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
            Loading tenant...
          </main>
        }
      >
        <TenantDetailClient />
      </Suspense>
    </WorkspaceShell>
  );
}
