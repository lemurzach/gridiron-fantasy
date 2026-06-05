import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  const week = url.searchParams.get("week");

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentWeek = week ? Number(week) : league.currentWeek;
  const schedule = await prisma.seasonSchedule.findUnique({
    where: { leagueId_week: { leagueId: id, week: currentWeek } },
    include: {
      matchups: {
        include: {
          homeTeam: { include: { user: true, roster: { include: { player: { include: { weekStats: { where: { schedule: { week: currentWeek } } } } } } } } },
          awayTeam: { include: { user: true, roster: { include: { player: { include: { weekStats: { where: { schedule: { week: currentWeek } } } } } } } } },
        },
      },
    },
  });
  return NextResponse.json({ schedule, currentWeek });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member || member.role !== "commissioner") {
    return NextResponse.json({ error: "Commissioner only" }, { status: 403 });
  }

  const { week, matchups } = await req.json();
  // matchups: [{homeTeamId, awayTeamId}]
  const schedule = await prisma.seasonSchedule.findUnique({
    where: { leagueId_week: { leagueId: id, week } },
  });
  if (!schedule) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  // Clear old matchups for this week
  await prisma.matchup.deleteMany({ where: { scheduleId: schedule.id } });

  // Create new matchups
  const created = await Promise.all(
    matchups.map((m: { homeTeamId: string; awayTeamId: string }) =>
      prisma.matchup.create({
        data: {
          leagueId: id,
          scheduleId: schedule.id,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
        },
        include: {
          homeTeam: { include: { user: true } },
          awayTeam: { include: { user: true } },
        },
      })
    )
  );
  return NextResponse.json(created, { status: 201 });
}
