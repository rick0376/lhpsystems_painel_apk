// src/app/api/apk/auth/login/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword } from "../../../../../lib/auth/password";
import { prisma } from "../../../../../lib/prisma";

const apkLoginSchema = z.object({
  appKey: z.string().min(1, "App Key obrigatória"),
  username: z.string().min(1, "Usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
  deviceId: z.string().min(1, "ID do dispositivo obrigatório"),
  deviceName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = apkLoginSchema.parse(body);

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
        projectId: project.id,
        username: data.username,
      },
      include: {
        devices: true,
      },
    });

    if (!apkUser) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Usuário ou senha inválidos.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordIsValid = await comparePassword(
      data.password,
      apkUser.passwordHash,
    );

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Usuário ou senha inválidos.",
        },
        {
          status: 401,
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

    const existingDevice = await prisma.device.findUnique({
      where: {
        apkUserId_deviceId: {
          apkUserId: apkUser.id,
          deviceId: data.deviceId,
        },
      },
    });

    if (existingDevice && !existingDevice.active) {
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

    if (!existingDevice) {
      const activeDevicesCount = await prisma.device.count({
        where: {
          apkUserId: apkUser.id,
          active: true,
        },
      });

      if (activeDevicesCount >= apkUser.maxDevices) {
        return NextResponse.json(
          {
            allowed: false,
            error: "Limite de dispositivos atingido.",
          },
          {
            status: 403,
          },
        );
      }

      await prisma.device.create({
        data: {
          apkUserId: apkUser.id,
          deviceId: data.deviceId,
          deviceName: data.deviceName || null,
          active: true,
          lastAccessAt: now,
        },
      });
    } else {
      await prisma.device.update({
        where: {
          id: existingDevice.id,
        },
        data: {
          deviceName: data.deviceName || existingDevice.deviceName,
          lastAccessAt: now,
        },
      });
    }

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
        error: "Não foi possível validar o acesso.",
      },
      {
        status: 400,
      },
    );
  }
}
