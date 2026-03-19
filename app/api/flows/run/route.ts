import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { flows, FlowKey } from "../../../../lib/flows";
import { ProfileEventType } from "@prisma/client";

type FlowRunRequest = {
  profileId: string;
  flowKey: FlowKey;
  answers: Record<string, string>;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as FlowRunRequest;
  const { profileId, flowKey, answers } = body;
  const profile = await prisma.personProfile.findFirst({
    where: { id: profileId, userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const flow = flows.find((f) => f.key === flowKey);
  if (!flow) return NextResponse.json({ error: "Invalid flow" }, { status: 400 });

  const result = flow.result(answers);

  const event = await prisma.profileEvent.create({
    data: {
      profileId,
      type: result.eventType ?? ProfileEventType.SYSTEM_RESULT,
      payload: { answers, result },
    },
  });

  await prisma.profileState.upsert({
    where: { profileId },
    update: { computedSummary: result.payload },
    create: { profileId, computedSummary: result.payload },
  });

  return NextResponse.json({ event, result });
}
