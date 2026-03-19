import { NextResponse } from "next/server";

// Stub handler for Stripe webhooks; to be wired with real signing secret.
export async function POST() {
  return NextResponse.json({ received: true });
}
