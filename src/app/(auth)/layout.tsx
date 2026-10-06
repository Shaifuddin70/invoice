export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="text-lg font-semibold">Invoicer</div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            Professional invoices,
            <br />
            in minutes.
          </h2>
          <p className="mt-4 max-w-md text-indigo-100">
            Manage your clients and services, send polished invoices in any currency, and keep track of
            what&apos;s been paid.
          </p>
        </div>
        <p className="text-sm text-indigo-200">© {new Date().getFullYear()} Invoicer</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
