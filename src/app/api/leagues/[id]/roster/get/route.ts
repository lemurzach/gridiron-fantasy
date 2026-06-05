import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const roster = await prisma.rosterPlayer.findMany({
    where: { leagueMemberId: member.id },
    include: {
      player: {
        include: {
          weekStats: {
            orderBy: { schedule: { week: "desc" } },
            take: 1,
          },
        },
      },
    },
  });
  return NextResponse.json(roster);
}
