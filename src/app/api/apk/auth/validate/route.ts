// src/app/api/apk/auth/validate/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";

const apkValidateSchema = z.object({
  appKey: z.string().min(1, "App Key obrigatória"),
  userId: z.string().min(1, "ID do usuário obrigatório"),
  deviceId: z.string().min(1, "ID do dispositivo obrigatório"),
  deviceName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = apkValidateSchema.parse(body);

    const project = await prisma.appProject.findUnique({
      where: {
        appKey: data.appKey,
      },
    });

    if (!project || !project.active) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Aplicativo não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const apkUser = await prisma.apkUser.findFirst({
      where: {
        id: data.userId,
        projectId: project.id,
      },
    });

    if (!apkUser) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Usuário não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (!apkUser.active) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Usuário bloqueado.",
        },
        {
          status: 403,
        },
      );
    }

    const now = new Date();

    if (apkUser.expiresAt && apkUser.expiresAt < now) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Licença expirada.",
        },
        {
          status: 403,
        },
      );
    }

    const device = await prisma.device.findUnique({
      where: {
        apkUserId_deviceId: {
          apkUserId: apkUser.id,
          deviceId: data.deviceId,
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Dispositivo não autorizado.",
        },
        {
          status: 403,
        },
      );
    }

    if (!device.active) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Este dispositivo está bloqueado.",
        },
        {
          status: 403,
        },
      );
    }

    await prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        deviceName: data.deviceName || device.deviceName,
        lastAccessAt: now,
      },
    });

    return NextResponse.json({
      allowed: true,
      user: {
        id: apkUser.id,
        name: apkUser.name,
        username: apkUser.username,
        expiresAt: apkUser.expiresAt,
        canTransmit: apkUser.canTransmit,
        canOpenSettings: apkUser.canOpenSettings,
        canEditRadioConfig: apkUser.canEditRadioConfig,
        maxDevices: apkUser.maxDevices,
      },
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        appKey: project.appKey,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          allowed: false,
          error: error.issues[0]?.message || "Dados inválidos.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        allowed: false,
        error: "Não foi possível validar a licença.",
      },
      {
        status: 400,
      },
    );
  }
}
