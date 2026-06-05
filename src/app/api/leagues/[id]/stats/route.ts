import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcFantasyPoints } from "@/lib/utils";

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

  const { week, playerStats } = await req.json();
  // playerStats: [{playerId, passYds, passTDs, passInts, rushYds, rushTDs, recYds, recTDs, receptions, fumbles, twoPointConversions, ...}]

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.seasonSchedule.findUnique({
    where: { leagueId_week: { leagueId: id, week } },
  });
  if (!schedule) return NextResponse.json({ error: "Week schedule not found" }, { status: 404 });

  const results = [];
  for (const ps of playerStats) {
    const fantasyPoints = calcFantasyPoints(ps, {
      scoringPassYds: league.scoringPassYds,
      scoringPassTD: league.scoringPassTD,
      scoringPassInt: league.scoringPassInt,
      scoringRushYds: league.scoringRushYds,
      scoringRushTD: league.scoringRushTD,
      scoringRecYds: league.scoringRecYds,
      scoringRecTD: league.scoringRecTD,
      scoringReception: league.scoringReception,
      scoringFumble: league.scoringFumble,
      scoring2pt: league.scoring2pt,
    });

    const stat = await prisma.weekStats.upsert({
      where: { playerId_scheduleId: { playerId: ps.playerId, scheduleId: schedule.id } },
      update: { ...ps, fantasyPoints, leagueId: id },
      create: { playerId: ps.playerId, scheduleId: schedule.id, leagueId: id, ...ps, fantasyPoints },
    });
    results.push(stat);
  }

  // Recalculate matchup scores for this week
  const weekMatchups = await prisma.matchup.findMany({
    where: { scheduleId: schedule.id },
    include: {
      homeTeam: { include: { roster: { where: { isStarter: true }, include: { player: { include: { weekStats: { where: { scheduleId: schedule.id } } } } } } } },
      awayTeam: { include: { roster: { where: { isStarter: true }, include: { player: { include: { weekStats: { where: { scheduleId: schedule.id } } } } } } } },
    },
  });

  for (const matchup of weekMatchups) {
    const homePoints = matchup.homeTeam.roster.reduce((sum, r) => sum + (r.player.weekStats[0]?.fantasyPoints ?? 0), 0);
    const awayPoints = matchup.awayTeam.roster.reduce((sum, r) => sum + (r.player.weekStats[0]?.fantasyPoints ?? 0), 0);
    await prisma.matchup.update({
      where: { id: matchup.id },
      data: { homePoints, awayPoints },
    });
  }

  return NextResponse.json(results);
}

// Finalize a week — set winners and update records
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member || member.role !== "commissioner") {
    return NextResponse.json({ error: "Commissioner only" }, { status: 403 });
  }

  const { week } = await req.json();
  const schedule = await prisma.seasonSchedule.findUnique({
    where: { leagueId_week: { leagueId: id, week } },
  });
  if (!schedule) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  const matchups = await prisma.matchup.findMany({ where: { scheduleId: schedule.id } });
  for (const matchup of matchups) {
    const winnerId = matchup.homePoints > matchup.awayPoints ? matchup.homeTeamId :
                     matchup.awayPoints > matchup.homePoints ? matchup.awayTeamId : null;
    await prisma.matchup.update({ where: { id: matchup.id }, data: { winnerId } });

    // Update standings
    if (winnerId) {
      const loserId = winnerId === matchup.homeTeamId ? matchup.awayTeamId : matchup.homeTeamId;
      await prisma.leagueMember.update({ where: { id: winnerId }, data: { wins: { increment: 1 }, pointsFor: { increment: Math.max(matchup.homePoints, matchup.awayPoints) }, pointsAgainst: { increment: Math.min(matchup.homePoints, matchup.awayPoints) } } });
      await prisma.leagueMember.update({ where: { id: loserId }, data: { losses: { increment: 1 }, pointsFor: { increment: Math.min(matchup.homePoints, matchup.awayPoints) }, pointsAgainst: { increment: Math.max(matchup.homePoints, matchup.awayPoints) } } });
    } else {
      await prisma.leagueMember.updateMany({
        where: { id: { in: [matchup.homeTeamId, matchup.awayTeamId] } },
        data: { ties: { increment: 1 }, pointsFor: { increment: (matchup.homePoints + matchup.awayPoints) / 2 }, pointsAgainst: { increment: (matchup.homePoints + matchup.awayPoints) / 2 } },
      });
    }
  }

  await prisma.seasonSchedule.update({ where: { id: schedule.id }, data: { status: "complete" } });
  await prisma.league.update({ where: { id }, data: { currentWeek: week + 1 } });

  return NextResponse.json({ ok: true });
}
