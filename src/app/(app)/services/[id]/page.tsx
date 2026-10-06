import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { isUuid } from "@/lib/form";
import { deleteService } from "@/app/actions/services";
import { PageHeader } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage(props: PageProps<"/services/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();
  if (!isUuid(id)) notFound();
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.userId, user.id)))
    .limit(1);
  if (!service) notFound();

  return (
    <div>
      <PageHeader
        title={service.name}
        description="Edit service"
        actions={
          <DeleteButton
            action={deleteService.bind(null, service.id)}
            confirmText={`Delete ${service.name}? Existing invoices keep their line items.`}
          />
        }
      />
      <ServiceForm service={service} />
    </div>
  );
}
