import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const schedules = await prisma.seasonSchedule.findMany({
    where: { leagueId: id },
    include: {
      matchups: {
        include: {
          homeTeam: { include: { user: true } },
          awayTeam: { include: { user: true } },
        },
      },
    },
    orderBy: { week: "asc" },
  });
  return NextResponse.json(schedules);
}

// Generate round-robin schedule
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

  const league = await prisma.league.findUnique({
    where: { id },
    include: { members: true, schedules: { include: { matchups: true } } },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberIds = league.members.map(m => m.id);
  const n = memberIds.length;
  const weeks = league.regularSeasonWeeks;

  // Simple round-robin generator
  const schedule: { week: number; pairs: [string, string][] }[] = [];
  const bye = n % 2 !== 0 ? "bye" : null;
  const list = bye ? [...memberIds, bye] : [...memberIds];
  const half = list.length / 2;

  for (let week = 1; week <= weeks; week++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[list.length - 1 - i];
      if (home !== "bye" && away !== "bye") {
        pairs.push([home as string, away as string]);
      }
    }
    schedule.push({ week, pairs });
    // Rotate (keep first fixed)
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  // Delete old matchups and create new
  for (const { week, pairs } of schedule) {
    const s = await prisma.seasonSchedule.findUnique({
      where: { leagueId_week: { leagueId: id, week } },
    });
    if (!s) continue;
    await prisma.matchup.deleteMany({ where: { scheduleId: s.id } });
    for (const [homeId, awayId] of pairs) {
      await prisma.matchup.create({
        data: { leagueId: id, scheduleId: s.id, homeTeamId: homeId, awayTeamId: awayId },
      });
    }
  }

  return NextResponse.json({ ok: true, weeks: schedule.length });
}
