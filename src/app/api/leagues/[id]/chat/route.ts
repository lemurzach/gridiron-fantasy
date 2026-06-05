import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = 50;

  const messages = await prisma.chatMessage.findMany({
    where: { leagueId: id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    include: {
      user: true,
      reactions: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(messages.reverse());
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { content, type, metadata } = await req.json();
  const message = await prisma.chatMessage.create({
    data: {
      leagueId: id,
      userId: session.user.id,
      content,
      type: type || "text",
      metadata: metadata ? JSON.stringify(metadata) : "{}",
    },
    include: { user: true, reactions: true },
  });
  return NextResponse.json(message, { status: 201 });
}
