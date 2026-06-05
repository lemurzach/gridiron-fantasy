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

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true, roster: { include: { player: true } } },
        orderBy: [{ wins: "desc" }, { pointsFor: "desc" }],
      },
      players: { orderBy: [{ position: "asc" }, { lastName: "asc" }] },
    },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...league, myMemberId: member.id, myRole: member.role });
}
