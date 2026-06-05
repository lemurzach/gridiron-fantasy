import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const body = await req.json();
  const allowed = [
    "name","description","maxRosters","rosterQB","rosterRB","rosterWR","rosterTE",
    "rosterFLEX","rosterK","rosterBench","rosterIR",
    "scoringPassYds","scoringPassTD","scoringPassInt","scoringRushYds","scoringRushTD",
    "scoringRecYds","scoringRecTD","scoringReception","scoringFumble","scoring2pt",
    "waiverType","waiverBudget","waiverDays","waiverDeadline",
    "tradeDeadlineWeek","tradeReviewDays","tradeVeto",
    "playoffStartWeek","playoffTeams","regularSeasonWeeks","status",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) data[key] = body[key];

  const updated = await prisma.league.update({ where: { id }, data });
  return NextResponse.json(updated);
}
