import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage(props: PageProps<"/clients/new">) {
  const { returnTo } = await props.searchParams;
  return (
    <div>
      <PageHeader title="New client" />
      <ClientForm returnTo={typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : undefined} />
    </div>
  );
}
