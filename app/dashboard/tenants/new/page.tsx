import { TenantForm } from "@/components/tenants/tenant-form";

export default function NewTenantPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Tenant</h1>
        <p className="text-muted-foreground mt-1">Register a new resident to the PG.</p>
      </div>
      <TenantForm />
    </div>
  );
}
