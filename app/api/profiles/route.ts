import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { maxProfilesForPlan } from "../../../lib/entitlements";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });
  const profiles = await prisma.personProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const displayName = (body.displayName as string)?.trim();
  if (!displayName) return NextResponse.json({ error: "displayName required" }, { status: 400 });

  const ent = await prisma.entitlement.findUnique({ where: { userId: session.user.id } });
  const plan = ent?.planType ?? "FREE";
  const maxProfiles = maxProfilesForPlan(plan);
  const count = await prisma.personProfile.count({ where: { userId: session.user.id } });
  if (count >= maxProfiles) {
    return NextResponse.json({ error: "Profile limit reached" }, { status: 402 });
  }

  const profile = await prisma.personProfile.create({
    data: {
      userId: session.user.id,
      displayName,
      tags: body.tags ?? [],
      avatarUrl: body.avatarUrl ?? null,
      context: body.context ?? {},
    },
  });
  return NextResponse.json(profile, { status: 201 });
}
