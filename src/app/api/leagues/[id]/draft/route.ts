import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { snakeDraftOrder } from "@/lib/utils";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const draft = await prisma.draft.findFirst({
    where: { leagueId: id },
    include: {
      picks: {
        include: {
          player: true,
          leagueMember: { include: { user: true } },
        },
        orderBy: { pickNumber: "asc" },
      },
    },
  });
  return NextResponse.json(draft);
}

// Create draft
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

  const { type, pickTimer } = await req.json();

  const league = await prisma.league.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberIds = league.members.map(m => m.id);
  const totalRosterSpots =
    league.rosterQB + league.rosterRB + league.rosterWR +
    league.rosterTE + league.rosterFLEX + league.rosterK +
    league.rosterBench + league.rosterIR;
  const totalPicks = memberIds.length * totalRosterSpots;

  const pickSlots = snakeDraftOrder(memberIds, totalRosterSpots);

  const draft = await prisma.draft.create({
    data: {
      leagueId: id,
      type: type || "snake",
      pickTimer: pickTimer || 90,
      totalPicks,
      draftOrder: JSON.stringify(memberIds),
      picks: {
        create: pickSlots.map(({ memberId, round, pick }) => ({
          leagueMemberId: memberId,
          round,
          pickNumber: pick,
        })),
      },
    },
    include: { picks: { include: { leagueMember: { include: { user: true } }, player: true }, orderBy: { pickNumber: "asc" } } },
  });

  await prisma.league.update({ where: { id }, data: { status: "pre_draft" } });
  return NextResponse.json(draft, { status: 201 });
}

// Make a pick
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { draftId, playerId } = await req.json();

  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    include: { picks: { orderBy: { pickNumber: "asc" } } },
  });
  if (!draft || draft.status !== "in_progress") {
    return NextResponse.json({ error: "Draft not active" }, { status: 400 });
  }

  const nextPick = draft.picks.find(p => !p.playerId);
  if (!nextPick) return NextResponse.json({ error: "Draft complete" }, { status: 400 });
  if (nextPick.leagueMemberId !== member.id) {
    return NextResponse.json({ error: "Not your pick" }, { status: 403 });
  }

  // Check player not already picked
  const alreadyPicked = draft.picks.some(p => p.playerId === playerId);
  if (alreadyPicked) return NextResponse.json({ error: "Player already drafted" }, { status: 400 });

  const updated = await prisma.draftPick.update({
    where: { id: nextPick.id },
    data: { playerId, pickedAt: new Date() },
    include: { player: true, leagueMember: { include: { user: true } } },
  });

  // Add to roster
  await prisma.rosterPlayer.create({
    data: { leagueMemberId: member.id, playerId, slot: "bench" },
  });

  // Check if draft complete
  const remaining = await prisma.draftPick.count({
    where: { draftId, playerId: null },
  });
  if (remaining === 0) {
    await prisma.draft.update({ where: { id: draftId }, data: { status: "complete", completedAt: new Date() } });
    await prisma.league.update({ where: { id }, data: { status: "in_season" } });
  } else {
    await prisma.draft.update({ where: { id: draftId }, data: { currentPick: draft.currentPick + 1 } });
  }

  return NextResponse.json(updated);
}
