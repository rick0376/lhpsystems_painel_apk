// src/app/api/apk/auth/validate/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeApkRequest } from "../../../../../lib/auth/apk-session";
import { createApkToken } from "../../../../../lib/auth/apk-token";
import { prisma } from "../../../../../lib/prisma";

const validateBodySchema = z.object({
  deviceName: z
    .string()
    .trim()
    .max(200)
    .optional(),
});

async function readBody(
  request: Request,
) {
  try {
    return validateBodySchema.parse(
      await request.json(),
    );
  } catch (error) {
    if (
      error instanceof
      SyntaxError
    ) {
      return {};
    }

    throw error;
  }
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * Valida:
     *
     * token
     * usuário
     * projeto
     * dispositivo
     * validade
     */
    const authorization =
      await authorizeApkRequest(
        request,
      );

    if (
      authorization.ok ===
      false
    ) {
      return NextResponse.json(
        {
          allowed: false,

          error:
            authorization.error,
        },
        {
          status:
            authorization.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const body =
      await readBody(
        request,
      );

    const now =
      new Date();

    /*
     * Atualiza último acesso.
     */
    await prisma.device.update({
      where: {
        id:
          authorization.device.id,
      },

      data: {
        deviceName:
          body.deviceName ||
          authorization.device
            .deviceName,

        lastAccessAt:
          now,
      },
    });

    /*
     * =====================================================
     * PERMISSÕES DINÂMICAS
     * =====================================================
     */

    const [
      projectPermissions,
      userPermissions,
    ] = await Promise.all([
      prisma.appPermission.findMany({
        where: {
          projectId:
            authorization.project.id,

          active: true,
        },

        select: {
          id: true,
          key: true,
        },

        orderBy: {
          name: "asc",
        },
      }),

      prisma.apkUserPermission.findMany({
        where: {
          apkUserId:
            authorization.user.id,

          permission: {
            projectId:
              authorization.project.id,

            active: true,
          },
        },

        select: {
          permissionId: true,
          allowed: true,
        },
      }),
    ]);

    const userPermissionMap =
      new Map(
        userPermissions.map(
          (item) => [
            item.permissionId,
            item.allowed,
          ],
        ),
      );

    const permissions =
      Object.fromEntries(
        projectPermissions.map(
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
     * RENOVA TOKEN
     * =====================================================
     */

    const access =
      await createApkToken({
        userId:
          authorization.user.id,

        projectId:
          authorization.project.id,

        deviceId:
          authorization.device
            .deviceId,
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

        /*
         * Permissões dinâmicas completas.
         */
        permissions,

        user: {
          id:
            authorization.user.id,

          name:
            authorization.user.name,

          username:
            authorization.user
              .username,

          expiresAt:
            authorization.user
              .expiresAt,

          maxDevices:
            authorization.user
              .maxDevices,

          /*
           * Permissões antigas.
           * Mantidas por compatibilidade.
           */
          canTransmit:
            authorization.user
              .canTransmit,

          canOpenSettings:
            authorization.user
              .canOpenSettings,

          canEditRadioConfig:
            false,

          canAccessRadioManager:
            authorization.user
              .canAccessRadioManager,

          canViewRadioDashboard:
            authorization.user
              .canViewRadioDashboard,

          canManageAutoDj:
            authorization.user
              .canManageAutoDj,

          canViewRadioLibrary:
            authorization.user
              .canViewRadioLibrary,

          canUploadRadioTracks:
            authorization.user
              .canUploadRadioTracks,

          canDeleteRadioTracks:
            authorization.user
              .canDeleteRadioTracks,

          canManageRadioPlaylists:
            authorization.user
              .canManageRadioPlaylists,

          canManageRadioSchedules:
            authorization.user
              .canManageRadioSchedules,

          canManageRadioIntervals:
            authorization.user
              .canManageRadioIntervals,

          canManageRadioSettings:
            authorization.user
              .canManageRadioSettings,

          canViewRadioAudit:
            authorization.user
              .canViewRadioAudit,

          /*
           * Todas as permissões dinâmicas
           * cadastradas no Painel LHP
           * entram também dentro de user.
           */
          ...permissions,
        },

        project: {
          id:
            authorization.project.id,

          name:
            authorization.project.name,

          slug:
            authorization.project.slug,

          appKey:
            authorization.project.appKey,
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
      "Erro ao validar licença APK:",
      error,
    );

    if (
      error instanceof
      z.ZodError
    ) {
      return NextResponse.json(
        {
          allowed: false,

          error:
            error.issues[0]
              ?.message ||
            "Dados inválidos.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        allowed: false,

        error:
          "Não foi possível validar a licença.",
      },
      {
        status: 400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}