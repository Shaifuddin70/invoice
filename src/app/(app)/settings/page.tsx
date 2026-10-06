import type { Metadata } from "next";
import { getProfile, requireUser } from "@/lib/dal";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Business settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div>
      <PageHeader title="Business settings" description="These details appear on every invoice you send." />
      <SettingsForm profile={profile} />
    </div>
  );
}
