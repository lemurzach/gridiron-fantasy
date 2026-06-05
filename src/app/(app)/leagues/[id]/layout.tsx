import { redirect, notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeagueSidebar } from "@/components/layout/LeagueSidebar";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getAuth();
  if (!session) redirect("/login");
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
    include: { league: true },
  });

  if (!member) notFound();

  return (
    <div className="flex h-full">
      <LeagueSidebar
        leagueId={id}
        leagueName={member.league.name}
        isCommissioner={member.role === "commissioner"}
        currentWeek={member.league.currentWeek}
      />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
