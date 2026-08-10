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

const permissionSchema = z.object({
  permissionId: z.string().min(1),
  allowed: z.boolean(),
});

const updateUserSchema = z.object({
  projectId: z.string().min(1, "Projeto obrigatório").optional(),

  name: z
    .string()
    .min(2, "Nome obrigatório")
    .optional(),

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

  maxDevices: z
    .number()
    .min(1, "Informe pelo menos 1 dispositivo")
    .optional(),

  notes: z.string().optional(),

  /*
   * NOVO:
   * permissões específicas do APK.
   */
  permissions: z.array(permissionSchema).optional(),

  /*
   * PERMISSÕES ANTIGAS
   *
   * Mantemos temporariamente para não quebrar
   * o Radio Manager enquanto fazemos a migração.
   */
  canTransmit: z.boolean().optional(),
  canOpenSettings: z.boolean().optional(),
  canEditRadioConfig: z.boolean().optional(),

  canAccessRadioManager: z.boolean().optional(),
  canViewRadioDashboard: z.boolean().optional(),
  canManageAutoDj: z.boolean().optional(),
  canViewRadioLibrary: z.boolean().optional(),
  canUploadRadioTracks: z.boolean().optional(),
  canDeleteRadioTracks: z.boolean().optional(),
  canManageRadioPlaylists: z.boolean().optional(),
  canManageRadioSchedules: z.boolean().optional(),
  canManageRadioIntervals: z.boolean().optional(),
  canManageRadioSettings: z.boolean().optional(),
  canViewRadioAudit: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: ApkUserRouteProps,
) {
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

      select: {
        id: true,
        projectId: true,
        username: true,
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

    const nextProjectId =
      data.projectId ?? user.projectId;

    const nextUsername =
      data.username ?? user.username;

    /*
     * Confere se o projeto existe.
     */
    const project = await prisma.appProject.findUnique({
      where: {
        id: nextProjectId,
      },

      select: {
        id: true,
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

    /*
     * Evita login duplicado dentro do mesmo APK.
     */
    const userAlreadyExists =
      await prisma.apkUser.findFirst({
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
          error:
            "Já existe outro usuário com esse login neste projeto.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Se vierem permissões, validamos se todas
     * realmente pertencem ao projeto selecionado.
     */
    if (data.permissions) {
      const permissionIds =
        data.permissions.map(
          (permission) =>
            permission.permissionId,
        );

      const uniquePermissionIds = [
        ...new Set(permissionIds),
      ];

      const validPermissions =
        await prisma.appPermission.findMany({
          where: {
            id: {
              in: uniquePermissionIds,
            },

            projectId: nextProjectId,

            active: true,
          },

          select: {
            id: true,
          },
        });

      if (
        validPermissions.length !==
        uniquePermissionIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais permissões não pertencem a este aplicativo.",
          },
          {
            status: 400,
          },
        );
      }
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

      canAccessRadioManager?: boolean;
      canViewRadioDashboard?: boolean;
      canManageAutoDj?: boolean;
      canViewRadioLibrary?: boolean;
      canUploadRadioTracks?: boolean;
      canDeleteRadioTracks?: boolean;
      canManageRadioPlaylists?: boolean;
      canManageRadioSchedules?: boolean;
      canManageRadioIntervals?: boolean;
      canManageRadioSettings?: boolean;
      canViewRadioAudit?: boolean;

      maxDevices?: number;
      notes?: string | null;
    } = {};

    if (data.projectId !== undefined) {
      updateData.projectId =
        data.projectId;
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.username !== undefined) {
      updateData.username =
        data.username;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    if (data.maxDevices !== undefined) {
      updateData.maxDevices =
        data.maxDevices;
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes || null;
    }

    /*
     * Mantemos suporte aos campos antigos.
     */
    if (data.canTransmit !== undefined) {
      updateData.canTransmit =
        data.canTransmit;
    }

    if (
      data.canOpenSettings !== undefined
    ) {
      updateData.canOpenSettings =
        data.canOpenSettings;
    }

    if (
      data.canEditRadioConfig !== undefined
    ) {
      updateData.canEditRadioConfig =
        data.canEditRadioConfig;
    }

    if (
      data.canAccessRadioManager !== undefined
    ) {
      updateData.canAccessRadioManager =
        data.canAccessRadioManager;
    }

    if (
      data.canViewRadioDashboard !== undefined
    ) {
      updateData.canViewRadioDashboard =
        data.canViewRadioDashboard;
    }

    if (
      data.canManageAutoDj !== undefined
    ) {
      updateData.canManageAutoDj =
        data.canManageAutoDj;
    }

    if (
      data.canViewRadioLibrary !== undefined
    ) {
      updateData.canViewRadioLibrary =
        data.canViewRadioLibrary;
    }

    if (
      data.canUploadRadioTracks !== undefined
    ) {
      updateData.canUploadRadioTracks =
        data.canUploadRadioTracks;
    }

    if (
      data.canDeleteRadioTracks !== undefined
    ) {
      updateData.canDeleteRadioTracks =
        data.canDeleteRadioTracks;
    }

    if (
      data.canManageRadioPlaylists !==
      undefined
    ) {
      updateData.canManageRadioPlaylists =
        data.canManageRadioPlaylists;
    }

    if (
      data.canManageRadioSchedules !==
      undefined
    ) {
      updateData.canManageRadioSchedules =
        data.canManageRadioSchedules;
    }

    if (
      data.canManageRadioIntervals !==
      undefined
    ) {
      updateData.canManageRadioIntervals =
        data.canManageRadioIntervals;
    }

    if (
      data.canManageRadioSettings !==
      undefined
    ) {
      updateData.canManageRadioSettings =
        data.canManageRadioSettings;
    }

    if (
      data.canViewRadioAudit !== undefined
    ) {
      updateData.canViewRadioAudit =
        data.canViewRadioAudit;
    }

    /*
     * Validade.
     */
    if (data.expiresAt !== undefined) {
      updateData.expiresAt =
        data.expiresAt
          ? new Date(
            `${data.expiresAt}T23:59:59.999Z`,
          )
          : null;
    }

    /*
     * Só troca a senha se uma nova tiver sido enviada.
     */
    if (data.password) {
      updateData.passwordHash =
        await hashPassword(data.password);
    }

    /*
     * Tudo em uma transação:
     *
     * 1. Atualiza o usuário
     * 2. Limpa permissões anteriores quando necessário
     * 3. Salva as permissões atuais
     */
    const updatedUser =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.apkUser.update({
              where: {
                id,
              },

              data: updateData,
            });

          /*
           * Se mudamos o usuário de projeto,
           * as permissões do projeto anterior
           * não podem continuar ligadas a ele.
           */
          const projectChanged =
            nextProjectId !==
            user.projectId;

          if (
            data.permissions !== undefined ||
            projectChanged
          ) {
            await tx.apkUserPermission.deleteMany(
              {
                where: {
                  apkUserId: id,
                },
              },
            );
          }

          /*
           * Salva somente as permissões
           * enviadas pelo formulário.
           */
          if (
            data.permissions &&
            data.permissions.length > 0
          ) {
            await tx.apkUserPermission.createMany(
              {
                data: data.permissions.map(
                  (permission) => ({
                    apkUserId: id,

                    permissionId:
                      permission.permissionId,

                    allowed:
                      permission.allowed,
                  }),
                ),
              },
            );
          }

          return updated;
        },
      );

    return NextResponse.json({
      apkUser: updatedUser,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar usuário APK:",
      error,
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ||
            "Dados inválidos.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível atualizar o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: ApkUserRouteProps,
) {
  const session =
    await getAdminSession();

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

    const user =
      await prisma.apkUser.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Usuário não encontrado.",
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
      message:
        "Usuário excluído com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao excluir usuário:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível excluir o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}