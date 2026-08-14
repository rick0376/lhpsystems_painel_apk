// src/app/api/apk/auth/login/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { createApkToken } from "../../../../../lib/auth/apk-token";
import { comparePassword } from "../../../../../lib/auth/password";
import { prisma } from "../../../../../lib/prisma";

const DEFAULT_SUPPORT_LABEL = "(12) 991890682";
const DEFAULT_SUPPORT_NUMBER = "5512991890682";

const DEFAULT_SUPPORT_MESSAGE =
  "Olá, preciso de ajuda com meu acesso ao aplicativo.";

type SupportProject = {
  supportWhatsappLabel?: string | null;
  supportWhatsappNumber?: string | null;
  supportWhatsappMessage?: string | null;
};

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function buildSupport(
  project?: SupportProject | null,
) {
  const whatsappLabel =
    project?.supportWhatsappLabel?.trim() ||
    DEFAULT_SUPPORT_LABEL;

  const rawNumber =
    onlyDigits(
      project?.supportWhatsappNumber,
    ) ||
    onlyDigits(
      project?.supportWhatsappLabel,
    ) ||
    DEFAULT_SUPPORT_NUMBER;

  const whatsappNumber =
    rawNumber.startsWith("55")
      ? rawNumber
      : rawNumber.length === 10 ||
        rawNumber.length === 11
        ? `55${rawNumber}`
        : rawNumber;

  const whatsappMessage =
    project?.supportWhatsappMessage?.trim() ||
    DEFAULT_SUPPORT_MESSAGE;

  return {
    whatsappLabel,
    whatsappNumber,
    whatsappMessage,

    whatsappUrl: whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage,
      )}`
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
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

const apkLoginSchema = z.object({
  appKey: z
    .string()
    .min(1, "App Key obrigatória")
    .max(200),

  username: z
    .string()
    .trim()
    .min(1, "Usuário obrigatório")
    .max(100),

  password: z
    .string()
    .min(1, "Senha obrigatória")
    .max(300),

  deviceId: z
    .string()
    .min(8, "ID do dispositivo inválido")
    .max(200),

  deviceName: z
    .string()
    .trim()
    .max(200)
    .optional(),
});

export async function POST(
  request: Request,
) {
  try {
    const data =
      apkLoginSchema.parse(
        await request.json(),
      );

    /*
     * Busca o projeto e todas as
     * permissões dinâmicas ativas.
     */
    const project =
      await prisma.appProject.findFirst({
        where: {
          appKey: {
            equals:
              data.appKey.trim(),

            mode: "insensitive",
          },
        },

        include: {
          permissions: {
            where: {
              active: true,
            },

            select: {
              id: true,
              key: true,
            },
          },
        },
      });

    if (
      !project ||
      !project.active
    ) {
      return denied(
        "Aplicativo não autorizado.",
        401,
        project,
      );
    }

    /*
     * Busca usuário e permissões
     * dinâmicas atribuídas.
     */
    const apkUser =
      await prisma.apkUser.findFirst({
        where: {
          projectId:
            project.id,

          username:
            data.username,
        },

        include: {
          permissions: {
            select: {
              permissionId: true,
              allowed: true,
            },
          },
        },
      });

    if (!apkUser) {
      return denied(
        "Usuário ou senha inválidos.",
        401,
        project,
      );
    }

    const passwordIsValid =
      await comparePassword(
        data.password,
        apkUser.passwordHash,
      );

    if (!passwordIsValid) {
      return denied(
        "Usuário ou senha inválidos.",
        401,
        project,
      );
    }

    if (!apkUser.active) {
      return denied(
        "Usuário bloqueado.",
        403,
        project,
      );
    }

    const now =
      new Date();

    if (
      apkUser.expiresAt &&
      apkUser.expiresAt < now
    ) {
      return denied(
        "Licença expirada.",
        403,
        project,
      );
    }

    /*
     * =====================================================
     * DISPOSITIVO
     * =====================================================
     */

    const existingDevice =
      await prisma.device.findUnique({
        where: {
          apkUserId_deviceId: {
            apkUserId:
              apkUser.id,

            deviceId:
              data.deviceId,
          },
        },
      });

    if (
      existingDevice &&
      !existingDevice.active
    ) {
      return denied(
        "Este dispositivo está bloqueado.",
        403,
        project,
      );
    }

    if (!existingDevice) {
      const activeDevicesCount =
        await prisma.device.count({
          where: {
            apkUserId:
              apkUser.id,

            active: true,
          },
        });

      if (
        activeDevicesCount >=
        apkUser.maxDevices
      ) {
        return denied(
          "Limite de dispositivos atingido.",
          403,
          project,
        );
      }

      await prisma.device.create({
        data: {
          apkUserId:
            apkUser.id,

          deviceId:
            data.deviceId,

          deviceName:
            data.deviceName ||
            null,

          active: true,

          lastAccessAt:
            now,
        },
      });
    } else {
      await prisma.device.update({
        where: {
          id:
            existingDevice.id,
        },

        data: {
          deviceName:
            data.deviceName ||
            existingDevice.deviceName,

          lastAccessAt:
            now,
        },
      });
    }

    /*
     * =====================================================
     * PERMISSÕES DINÂMICAS
     * =====================================================
     */

    const userPermissionMap =
      new Map(
        apkUser.permissions.map(
          (item) => [
            item.permissionId,
            item.allowed,
          ],
        ),
      );

    const permissions =
      Object.fromEntries(
        project.permissions.map(
          (permission) => [
            permission.key,

            userPermissionMap.get(
              permission.id,
            ) ?? false,
          ],
        ),
      );

    /*
     * =====================================================
     * TOKEN
     * =====================================================
     */

    const access =
      await createApkToken({
        userId:
          apkUser.id,

        projectId:
          project.id,

        deviceId:
          data.deviceId,
      });

    /*
     * =====================================================
     * RESPOSTA
     * =====================================================
     */

    return NextResponse.json(
      {
        allowed: true,

        accessToken:
          access.token,

        expiresInSeconds:
          access.expiresInSeconds,

        support:
          buildSupport(project),

        /*
         * Permissões dinâmicas completas.
         */
        permissions,

        user: {
          id:
            apkUser.id,

          name:
            apkUser.name,

          username:
            apkUser.username,

          expiresAt:
            apkUser.expiresAt,

          maxDevices:
            apkUser.maxDevices,

          /*
           * Permissões antigas.
           * Mantidas por compatibilidade.
           */
          canTransmit:
            apkUser.canTransmit,

          canOpenSettings:
            apkUser.canOpenSettings,

          canEditRadioConfig:
            false,

          canAccessRadioManager:
            apkUser.canAccessRadioManager,

          canViewRadioDashboard:
            apkUser.canViewRadioDashboard,

          canManageAutoDj:
            apkUser.canManageAutoDj,

          canViewRadioLibrary:
            apkUser.canViewRadioLibrary,

          canUploadRadioTracks:
            apkUser.canUploadRadioTracks,

          canDeleteRadioTracks:
            apkUser.canDeleteRadioTracks,

          canManageRadioPlaylists:
            apkUser.canManageRadioPlaylists,

          canManageRadioSchedules:
            apkUser.canManageRadioSchedules,

          canManageRadioIntervals:
            apkUser.canManageRadioIntervals,

          canManageRadioSettings:
            apkUser.canManageRadioSettings,

          canViewRadioAudit:
            apkUser.canViewRadioAudit,

          /*
           * IMPORTANTE:
           *
           * Coloca automaticamente dentro
           * do usuário TODAS as permissões
           * dinâmicas cadastradas no Painel.
           *
           * Exemplos:
           *
           * canViewRadioPlaylists
           * canCreateRadioPlaylists
           * canDeleteRadioPlaylists
           * canEditRadioSchedules
           * canClearRadioAudit
           *
           * Não precisamos criar uma coluna
           * nova no Prisma para cada uma.
           */
          ...permissions,
        },

        project: {
          id:
            project.id,

          name:
            project.name,

          slug:
            project.slug,

          appKey:
            project.appKey,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro no login APK:",
      error,
    );

    if (
      error instanceof
      z.ZodError
    ) {
      return denied(
        error.issues[0]
          ?.message ||
        "Dados inválidos.",
        400,
      );
    }

    return denied(
      "Não foi possível validar o acesso.",
      400,
    );
  }
}