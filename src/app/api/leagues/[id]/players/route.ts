import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const players = await prisma.player.findMany({
    where: { leagueId: id },
    include: {
      rosterSlots: { include: { leagueMember: { include: { user: true } } } },
      weekStats: { orderBy: { schedule: { week: "desc" } }, take: 5 },
    },
    orderBy: [{ position: "asc" }, { lastName: "asc" }],
  });
  return NextResponse.json(players);
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

  const { firstName, lastName, position, jerseyNumber, teamName } = await req.json();
  const player = await prisma.player.create({
    data: { leagueId: id, firstName, lastName, position, jerseyNumber, teamName },
  });
  return NextResponse.json(player, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member || member.role !== "commissioner") {
    return NextResponse.json({ error: "Commissioner only" }, { status: 403 });
  }

  const { playerId } = await req.json();
  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ ok: true });
}
