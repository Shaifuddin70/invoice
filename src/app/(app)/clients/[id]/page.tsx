import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { isUuid } from "@/lib/form";
import { deleteClient } from "@/app/actions/clients";
import { PageHeader } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage(props: PageProps<"/clients/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();
  if (!isUuid(id)) notFound();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
    .limit(1);
  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={client.name}
        description="Edit client details"
        actions={
          <DeleteButton
            action={deleteClient.bind(null, client.id)}
            confirmText={`Delete ${client.name}? This cannot be undone.`}
          />
        }
      />
      <ClientForm client={client} />
    </div>
  );
}
