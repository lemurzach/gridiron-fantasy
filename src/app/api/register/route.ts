import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, username, displayName, password } = await req.json();
    if (!email || !username || !displayName || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, displayName, password: hashed },
    });
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error — please try again" }, { status: 500 });
  }
}
