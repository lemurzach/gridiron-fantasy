import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const draft = await prisma.draft.findFirst({ where: { leagueId: id } });
  if (!draft) return NextResponse.json({ error: "No draft found" }, { status: 404 });

  const updated = await prisma.draft.update({
    where: { id: draft.id },
    data: { status: "in_progress", startedAt: new Date() },
  });
  await prisma.league.update({ where: { id }, data: { status: "drafting" } });
  return NextResponse.json(updated);
}
