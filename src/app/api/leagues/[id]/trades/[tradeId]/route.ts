import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tradeId: string }> }
) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, tradeId } = await params;
  const { action } = await req.json(); // accept | reject | veto

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { items: { include: { player: true } } },
  });
  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  if (action === "accept" && trade.receiverId === member.id) {
    // Execute trade: move players
    for (const item of trade.items) {
      if (item.playerId) {
        await prisma.rosterPlayer.updateMany({
          where: { playerId: item.playerId, leagueMemberId: item.fromMemberId },
          data: { leagueMemberId: item.toMemberId, isStarter: false, slot: "bench" },
        });
      }
    }
    await prisma.trade.update({ where: { id: tradeId }, data: { status: "accepted" } });
    await prisma.transaction.create({
      data: {
        leagueId: id,
        type: "trade_accepted",
        description: `Trade accepted between ${trade.proposerId} and ${trade.receiverId}`,
        metadata: JSON.stringify({ tradeId }),
      },
    });
  } else if (action === "reject" && trade.receiverId === member.id) {
    await prisma.trade.update({ where: { id: tradeId }, data: { status: "rejected" } });
  } else if (action === "veto" && member.role === "commissioner") {
    await prisma.trade.update({ where: { id: tradeId }, data: { status: "vetoed" } });
  } else {
    return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
  }

  const updated = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      proposer: { include: { user: true } },
      receiver: { include: { user: true } },
      items: { include: { player: true } },
    },
  });
  return NextResponse.json(updated);
}
