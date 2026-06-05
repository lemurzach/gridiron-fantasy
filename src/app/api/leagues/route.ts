import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: {
      league: {
        include: { members: { include: { user: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(memberships.map(m => ({ ...m.league, myRole: m.role, myTeamName: m.teamName })));
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, season, teamName, maxRosters } = body;
  if (!name || !season || !teamName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const league = await prisma.league.create({
    data: {
      name,
      description,
      season: Number(season),
      maxRosters: Number(maxRosters) || 10,
      members: {
        create: {
          userId: session.user.id,
          teamName,
          role: "commissioner",
          waiverOrder: 1,
        },
      },
    },
    include: { members: { include: { user: true } } },
  });

  // Generate initial schedule skeleton
  const regularWeeks = league.regularSeasonWeeks;
  for (let w = 1; w <= regularWeeks + 3; w++) {
    await prisma.seasonSchedule.create({
      data: { leagueId: league.id, week: w },
    });
  }

  return NextResponse.json(league, { status: 201 });
}
