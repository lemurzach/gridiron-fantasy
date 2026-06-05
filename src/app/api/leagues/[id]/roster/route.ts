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
          weekStats: { orderBy: { schedule: { week: "desc" } }, take: 1 },
        },
      },
    },
  });
  return NextResponse.json(roster);
}

// Update lineup (set starters)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // { starters: [{playerId, slot}], bench: [playerId] }
  const { starters, bench } = await req.json();

  for (const { playerId, slot } of starters) {
    await prisma.rosterPlayer.updateMany({
      where: { leagueMemberId: member.id, playerId },
      data: { isStarter: true, slot },
    });
  }
  for (const playerId of bench) {
    await prisma.rosterPlayer.updateMany({
      where: { leagueMemberId: member.id, playerId },
      data: { isStarter: false, slot: "bench" },
    });
  }

  const roster = await prisma.rosterPlayer.findMany({
    where: { leagueMemberId: member.id },
    include: { player: true },
  });
  return NextResponse.json(roster);
}

// Add a free agent (direct add, not waiver)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
    include: { roster: true },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { addPlayerId, dropPlayerId } = await req.json();
  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  // Check player is free
  const alreadyRostered = await prisma.rosterPlayer.findFirst({
    where: { playerId: addPlayerId, leagueMember: { leagueId: id } },
  });
  if (alreadyRostered) return NextResponse.json({ error: "Player is already rostered" }, { status: 400 });

  // Drop if specified
  if (dropPlayerId) {
    await prisma.rosterPlayer.deleteMany({
      where: { leagueMemberId: member.id, playerId: dropPlayerId },
    });
    await prisma.transaction.create({
      data: { leagueId: id, type: "drop", description: `Dropped player`, metadata: JSON.stringify({ playerId: dropPlayerId, memberId: member.id }) },
    });
  }

  await prisma.rosterPlayer.create({
    data: { leagueMemberId: member.id, playerId: addPlayerId, slot: "bench" },
  });

  await prisma.transaction.create({
    data: { leagueId: id, type: "add", description: `Added player`, metadata: JSON.stringify({ playerId: addPlayerId, memberId: member.id }) },
  });

  return NextResponse.json({ ok: true });
}

// Drop a player
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { playerId } = await req.json();
  await prisma.rosterPlayer.deleteMany({
    where: { leagueMemberId: member.id, playerId },
  });

  await prisma.transaction.create({
    data: { leagueId: id, type: "drop", description: `Dropped player`, metadata: JSON.stringify({ playerId, memberId: member.id }) },
  });

  return NextResponse.json({ ok: true });
}
