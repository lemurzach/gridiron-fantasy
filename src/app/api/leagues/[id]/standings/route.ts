import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: id },
    include: {
      user: true,
      matchupsHome: { include: { schedule: true } },
      matchupsAway: { include: { schedule: true } },
    },
    orderBy: [{ wins: "desc" }, { pointsFor: "desc" }],
  });
  return NextResponse.json(members);
}
