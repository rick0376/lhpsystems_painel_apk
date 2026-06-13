// src/app/api/apk-users/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../lib/auth/session";
import { hashPassword } from "../../../lib/auth/password";
import { prisma } from "../../../lib/prisma";

const createApkUserSchema = z.object({
  projectId: z.string().min(1, "Projeto obrigatório"),
  name: z.string().min(2, "Nome obrigatório"),
  username: z
    .string()
    .min(3, "Usuário precisa ter no mínimo 3 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use apenas letras, números, ponto, hífen ou underline",
    ),
  password: z.string().min(6, "Senha precisa ter no mínimo 6 caracteres"),
  active: z.boolean(),
  expiresAt: z.string().optional(),
  canTransmit: z.boolean(),
  canOpenSettings: z.boolean(),
  canEditRadioConfig: z.boolean(),
  maxDevices: z.number().min(1, "Informe pelo menos 1 dispositivo"),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body = await request.json();

    const data = createApkUserSchema.parse(body);

    const project = await prisma.appProject.findUnique({
      where: {
        id: data.projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          error: "Projeto não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const userAlreadyExists = await prisma.apkUser.findFirst({
      where: {
        projectId: data.projectId,
        username: data.username,
      },
    });

    if (userAlreadyExists) {
      return NextResponse.json(
        {
          error: "Já existe um usuário com esse login neste projeto.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash = await hashPassword(data.password);

    const apkUser = await prisma.apkUser.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        username: data.username,
        passwordHash,
        active: data.active,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        canTransmit: data.canTransmit,
        canOpenSettings: data.canOpenSettings,
        canEditRadioConfig: data.canEditRadioConfig,
        maxDevices: data.maxDevices,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({
      apkUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || "Dados inválidos.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Não foi possível cadastrar o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}
