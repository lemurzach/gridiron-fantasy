import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
