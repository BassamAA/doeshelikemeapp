import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { ProfileEventType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };
type EventRequestBody = {
  type?: string;
  payload?: unknown;
  timestamp?: string;
};

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await prisma.profileEvent.findMany({
    where: { profileId: id, profile: { userId: session.user.id } },
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  return NextResponse.json(events);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.personProfile.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as EventRequestBody;
  const { type, payload, timestamp } = body;
  if (!type || !Object.values(ProfileEventType).includes(type as ProfileEventType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const event = await prisma.profileEvent.create({
    data: {
      profileId: id,
      type: type as ProfileEventType,
      payload: payload || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    },
  });
  return NextResponse.json(event, { status: 201 });
}
