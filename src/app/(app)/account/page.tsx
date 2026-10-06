import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { PageHeader } from "@/components/ui";
import { AccountForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = { title: "My profile" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader title="My profile" description="Your login details. Your name is printed as the invoice signatory." />
      <div className="space-y-6">
        <AccountForm name={user.name} email={user.email} />
        <PasswordForm />
      </div>
    </div>
  );
}
