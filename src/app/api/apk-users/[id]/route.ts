// src/app/api/apk-users/[id]/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../../lib/auth/session";
import { hashPassword } from "../../../../lib/auth/password";
import { prisma } from "../../../../lib/prisma";

type ApkUserRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateUserSchema = z.object({
  projectId: z.string().min(1, "Projeto obrigatório").optional(),
  name: z.string().min(2, "Nome obrigatório").optional(),
  username: z
    .string()
    .min(3, "Usuário precisa ter no mínimo 3 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use apenas letras, números, ponto, hífen ou underline",
    )
    .optional(),
  password: z
    .string()
    .min(6, "Senha precisa ter no mínimo 6 caracteres")
    .optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().optional(),
  canTransmit: z.boolean().optional(),
  canOpenSettings: z.boolean().optional(),
  canEditRadioConfig: z.boolean().optional(),
  maxDevices: z.number().min(1, "Informe pelo menos 1 dispositivo").optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: Request, { params }: ApkUserRouteProps) {
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
    const { id } = await params;
    const body = await request.json();

    const data = updateUserSchema.parse(body);

    const user = await prisma.apkUser.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const nextProjectId = data.projectId ?? user.projectId;
    const nextUsername = data.username ?? user.username;

    const userAlreadyExists = await prisma.apkUser.findFirst({
      where: {
        id: {
          not: id,
        },
        projectId: nextProjectId,
        username: nextUsername,
      },
    });

    if (userAlreadyExists) {
      return NextResponse.json(
        {
          error: "Já existe outro usuário com esse login neste projeto.",
        },
        {
          status: 400,
        },
      );
    }

    const updateData: {
      projectId?: string;
      name?: string;
      username?: string;
      passwordHash?: string;
      active?: boolean;
      expiresAt?: Date | null;
      canTransmit?: boolean;
      canOpenSettings?: boolean;
      canEditRadioConfig?: boolean;
      maxDevices?: number;
      notes?: string | null;
    } = {};

    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.canTransmit !== undefined)
      updateData.canTransmit = data.canTransmit;
    if (data.canOpenSettings !== undefined)
      updateData.canOpenSettings = data.canOpenSettings;
    if (data.canEditRadioConfig !== undefined)
      updateData.canEditRadioConfig = data.canEditRadioConfig;
    if (data.maxDevices !== undefined) updateData.maxDevices = data.maxDevices;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const updatedUser = await prisma.apkUser.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({
      apkUser: updatedUser,
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
        error: "Não foi possível atualizar o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(_request: Request, { params }: ApkUserRouteProps) {
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
    const { id } = await params;

    const user = await prisma.apkUser.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.apkUser.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível excluir o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}
