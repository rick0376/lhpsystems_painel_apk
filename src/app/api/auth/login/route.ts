// src/app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { comparePassword } from "../../../../lib/auth/password";
import { createAdminToken } from "../../../../lib/auth/token";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = loginSchema.parse(body);

    const admin = await prisma.admin.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!admin || !admin.active) {
      return NextResponse.json(
        {
          error: "E-mail ou senha inválidos.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordIsValid = await comparePassword(
      data.password,
      admin.passwordHash,
    );

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          error: "E-mail ou senha inválidos.",
        },
        {
          status: 401,
        },
      );
    }

    const token = await createAdminToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: "lhp_admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível fazer login.",
      },
      {
        status: 400,
      },
    );
  }
}
