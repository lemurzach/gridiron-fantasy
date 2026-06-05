import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const claims = await prisma.waiverClaim.findMany({
    where: { leagueId: id },
    include: {
      leagueMember: { include: { user: true } },
      addPlayer: true,
      dropPlayer: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(claims);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { addPlayerId, dropPlayerId, bidAmount } = await req.json();

  const claim = await prisma.waiverClaim.create({
    data: {
      leagueId: id,
      leagueMemberId: member.id,
      addPlayerId,
      dropPlayerId,
      bidAmount: bidAmount ?? 0,
      priority: member.waiverOrder,
    },
    include: { addPlayer: true, dropPlayer: true },
  });
  return NextResponse.json(claim, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { claimId } = await req.json();
  await prisma.waiverClaim.deleteMany({
    where: { id: claimId, leagueMemberId: member.id },
  });
  return NextResponse.json({ ok: true });
}
