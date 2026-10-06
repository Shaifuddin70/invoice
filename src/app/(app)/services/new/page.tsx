import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "New service" };

export default function NewServicePage() {
  return (
    <div>
      <PageHeader title="New service" />
      <ServiceForm />
    </div>
  );
}
