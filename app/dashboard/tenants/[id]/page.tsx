import { TenantDetail } from "@/features/tenants";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <TenantDetail tenantId={resolvedParams.id} />
    </div>
  );
}
