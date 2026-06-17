// src/app/api/apk/auth/validate/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";

const DEFAULT_SUPPORT_LABEL = "(12) 991890682";
const DEFAULT_SUPPORT_NUMBER = "5512991890682";
const DEFAULT_SUPPORT_MESSAGE =
  "Olá, minha licença do LHP Projection Center expirou. Pode me ajudar?";

type SupportProject = {
  supportWhatsappLabel?: string | null;
  supportWhatsappNumber?: string | null;
  supportWhatsappMessage?: string | null;
};

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function buildSupport(project?: SupportProject | null) {
  const whatsappLabel =
    project?.supportWhatsappLabel?.trim() || DEFAULT_SUPPORT_LABEL;

  const rawNumber =
    onlyDigits(project?.supportWhatsappNumber) ||
    onlyDigits(project?.supportWhatsappLabel) ||
    DEFAULT_SUPPORT_NUMBER;

  const whatsappNumber = rawNumber.startsWith("55")
    ? rawNumber
    : rawNumber.length === 10 || rawNumber.length === 11
      ? `55${rawNumber}`
      : rawNumber;

  const whatsappMessage =
    project?.supportWhatsappMessage?.trim() || DEFAULT_SUPPORT_MESSAGE;

  return {
    whatsappLabel,
    whatsappNumber,
    whatsappMessage,
    whatsappUrl: whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
      : null,
  };
}

function denied(
  error: string,
  status: number,
  project?: SupportProject | null,
) {
  return NextResponse.json(
    {
      allowed: false,
      error,
      support: buildSupport(project),
    },
    { status },
  );
}

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
      where: { appKey: data.appKey },
    });

    if (!project || !project.active) {
      return denied("Aplicativo não autorizado.", 401, project);
    }

    const apkUser = await prisma.apkUser.findFirst({
      where: {
        id: data.userId,
        projectId: project.id,
      },
    });

    if (!apkUser) {
      return denied("Usuário não encontrado.", 404, project);
    }

    if (!apkUser.active) {
      return denied("Usuário bloqueado.", 403, project);
    }

    const now = new Date();

    if (apkUser.expiresAt && apkUser.expiresAt < now) {
      return denied("Licença expirada.", 403, project);
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
      return denied("Dispositivo não autorizado.", 403, project);
    }

    if (!device.active) {
      return denied("Este dispositivo está bloqueado.", 403, project);
    }

    await prisma.device.update({
      where: { id: device.id },
      data: {
        deviceName: data.deviceName || device.deviceName,
        lastAccessAt: now,
      },
    });

    return NextResponse.json({
      allowed: true,
      support: buildSupport(project),
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
      return denied(error.issues[0]?.message || "Dados inválidos.", 400);
    }

    return denied("Não foi possível validar a licença.", 400);
  }
}
