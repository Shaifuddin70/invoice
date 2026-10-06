import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/dal";
import { logoUrl } from "@/lib/brand";
import { Sidebar } from "@/components/sidebar";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const name = profile.businessName || "Invoicer";
  const logo = logoUrl(profile);
  return {
    title: { default: name, template: `%s · ${name}` },
    ...(logo && { icons: { icon: logo, apple: logo } }),
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        businessName={profile.businessName || user.name}
        logoUrl={logoUrl(profile)}
        userName={user.name}
        userEmail={user.email}
      />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
