import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trades = await prisma.trade.findMany({
    where: { leagueId: id },
    include: {
      proposer: { include: { user: true } },
      receiver: { include: { user: true } },
      items: { include: { player: true, fromMember: { include: { user: true } }, toMember: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trades);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const proposerMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!proposerMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { receiverId, notes, items } = await req.json();
  // items: [{playerId, fromMemberId, toMemberId}]

  const trade = await prisma.trade.create({
    data: {
      leagueId: id,
      proposerId: proposerMember.id,
      receiverId,
      proposedById: session.user.id,
      notes,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      items: {
        create: items.map((item: { playerId: string; fromMemberId: string; toMemberId: string }) => ({
          playerId: item.playerId,
          fromMemberId: item.fromMemberId,
          toMemberId: item.toMemberId,
        })),
      },
    },
    include: {
      proposer: { include: { user: true } },
      receiver: { include: { user: true } },
      items: { include: { player: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: (await prisma.leagueMember.findUnique({ where: { id: receiverId } }))!.userId,
      type: "trade_proposal",
      title: "New Trade Proposal",
      body: `${proposerMember.teamName} sent you a trade offer`,
      leagueId: id,
      metadata: JSON.stringify({ tradeId: trade.id }),
    },
  });

  return NextResponse.json(trade, { status: 201 });
}
