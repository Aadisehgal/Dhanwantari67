import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSeed } from "@/lib/seed-runner";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (!process.env.SEED_SECRET) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured on the server. Set it in your Vercel project's Environment Variables." },
      { status: 500 }
    );
  }

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret." }, { status: 401 });
  }

  try {
    const log = await runSeed(prisma);
    return NextResponse.json({ ok: true, log });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error during seeding" },
      { status: 500 }
    );
  }
}
