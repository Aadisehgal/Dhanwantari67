import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (!process.env.SEED_SECRET) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured on the server." },
      { status: 500 }
    );
  }
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret." }, { status: 401 });
  }

  try {
    const role = await prisma.role.findUnique({ where: { name: "HOSPITAL_ADMIN" } });
    if (!role) {
      return NextResponse.json(
        { error: "HOSPITAL_ADMIN role not found. Run /api/setup first to seed base roles." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash("Aadi/9759357567", 10);

    const user = await prisma.user.upsert({
      where: { email: "aadisehgal10@gmail.com" },
      update: { name: "Aadi Sehgal", passwordHash, roleId: role.id, isActive: true },
      create: {
        email: "aadisehgal10@gmail.com",
        name: "Aadi Sehgal",
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
    });

    // If this email was previously (mistakenly) used to create a Doctor login,
    // detach that Doctor profile so this account behaves as a pure admin account.
    const existingDoctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (existingDoctor) {
      await prisma.doctor.delete({ where: { id: existingDoctor.id } });
    }

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      removedDoctorProfile: Boolean(existingDoctor),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
