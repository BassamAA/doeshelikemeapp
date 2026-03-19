import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.personProfile.findFirst({
    where: { id, userId: session.user.id },
    include: { events: { orderBy: { timestamp: "desc" }, take: 50 }, state: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const profile = await prisma.personProfile.update({
    where: { id, userId: session.user.id },
    data: {
      displayName: body.displayName ?? undefined,
      tags: body.tags ?? undefined,
      avatarUrl: body.avatarUrl ?? undefined,
      context: body.context ?? undefined,
    },
  });
  return NextResponse.json(profile);
}
