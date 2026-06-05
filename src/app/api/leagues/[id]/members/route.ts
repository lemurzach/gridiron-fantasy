import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Join a league by invite code
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { teamName } = await req.json();

  const league = await prisma.league.findUnique({ where: { id }, include: { members: true } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.members.length >= league.maxRosters) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }
  const existing = league.members.find(m => m.userId === session.user.id);
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const member = await prisma.leagueMember.create({
    data: {
      leagueId: id,
      userId: session.user.id,
      teamName: teamName || `${session.user.name}'s Team`,
      waiverOrder: league.members.length + 1,
    },
    include: { user: true },
  });
  return NextResponse.json(member, { status: 201 });
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: id },
    include: {
      user: true,
      roster: { include: { player: true } },
    },
    orderBy: [{ wins: "desc" }, { pointsFor: "desc" }],
  });
  return NextResponse.json(members);
}
