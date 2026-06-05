import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { inviteCode, teamName } = await req.json();

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    include: { members: true },
  });
  if (!league) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  if (league.members.length >= league.maxRosters) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }
  const existing = league.members.find(m => m.userId === session.user.id);
  if (existing) return NextResponse.json({ leagueId: league.id });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: session.user.id,
      teamName: teamName || `${session.user.name}'s Team`,
      waiverOrder: league.members.length + 1,
    },
  });
  return NextResponse.json({ leagueId: league.id });
}
