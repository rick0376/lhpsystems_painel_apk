// src/app/api/apk-users/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "../../../lib/auth/session";
import { hashPassword } from "../../../lib/auth/password";
import { prisma } from "../../../lib/prisma";

const permissionSchema = z.object({
  permissionId: z
    .string()
    .min(1, "Permissão inválida"),

  allowed: z.boolean(),
});

const createApkUserSchema = z.object({
  projectId: z
    .string()
    .min(1, "Projeto obrigatório"),

  name: z
    .string()
    .trim()
    .min(2, "Nome obrigatório"),

  username: z
    .string()
    .trim()
    .min(
      3,
      "Usuário precisa ter no mínimo 3 caracteres",
    )
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use apenas letras, números, ponto, hífen ou underline",
    ),

  password: z
    .string()
    .min(
      6,
      "Senha precisa ter no mínimo 6 caracteres",
    ),

  active: z.boolean(),

  expiresAt: z
    .string()
    .optional(),

  maxDevices: z
    .number()
    .min(
      1,
      "Informe pelo menos 1 dispositivo",
    ),

  notes: z
    .string()
    .optional(),

  permissions: z
    .array(permissionSchema)
    .default([]),

  /*
   * CAMPOS LEGADOS
   *
   * Permanecem temporariamente aceitos
   * para compatibilidade com o
   * Radio Manager antigo.
   *
   * A nova interface não depende deles.
   */

  canTransmit: z
    .boolean()
    .optional(),

  canOpenSettings: z
    .boolean()
    .optional(),

  canEditRadioConfig: z
    .boolean()
    .optional(),

  canAccessRadioManager: z
    .boolean()
    .optional(),

  canViewRadioDashboard: z
    .boolean()
    .optional(),

  canManageAutoDj: z
    .boolean()
    .optional(),

  canViewRadioLibrary: z
    .boolean()
    .optional(),

  canUploadRadioTracks: z
    .boolean()
    .optional(),

  canDeleteRadioTracks: z
    .boolean()
    .optional(),

  canManageRadioPlaylists: z
    .boolean()
    .optional(),

  canManageRadioSchedules: z
    .boolean()
    .optional(),

  canManageRadioIntervals: z
    .boolean()
    .optional(),

  canManageRadioSettings: z
    .boolean()
    .optional(),

  canViewRadioAudit: z
    .boolean()
    .optional(),
});

export async function POST(
  request: Request,
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
    const body =
      await request.json();

    const data =
      createApkUserSchema.parse(body);

    /*
     * Confere se o projeto existe
     * e está ativo.
     */
    const project =
      await prisma.appProject.findUnique({
        where: {
          id: data.projectId,
        },

        select: {
          id: true,
          active: true,
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error:
            "Projeto não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (!project.active) {
      return NextResponse.json(
        {
          error:
            "Este projeto está bloqueado.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Login precisa ser único
     * dentro daquele projeto.
     */
    const userAlreadyExists =
      await prisma.apkUser.findFirst({
        where: {
          projectId:
            data.projectId,

          username:
            data.username,
        },

        select: {
          id: true,
        },
      });

    if (userAlreadyExists) {
      return NextResponse.json(
        {
          error:
            "Já existe um usuário com esse login neste projeto.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Validação das permissões.
     *
     * Nenhuma permissão de outro
     * aplicativo poderá ser enviada
     * para este usuário.
     */
    const permissionIds =
      data.permissions.map(
        (permission) =>
          permission.permissionId,
      );

    const uniquePermissionIds = [
      ...new Set(permissionIds),
    ];

    if (
      uniquePermissionIds.length !==
      permissionIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Existem permissões duplicadas na solicitação.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      uniquePermissionIds.length > 0
    ) {
      const validPermissions =
        await prisma.appPermission.findMany(
          {
            where: {
              id: {
                in: uniquePermissionIds,
              },

              projectId:
                data.projectId,

              active: true,
            },

            select: {
              id: true,
            },
          },
        );

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

    const passwordHash =
      await hashPassword(
        data.password,
      );

    /*
     * Separamos senha e permissões
     * dos dados principais.
     */
    const {
      password: _password,
      permissions,
      ...userData
    } = data;

    /*
     * Usuário + permissões são criados
     * juntos dentro da mesma transação.
     */
    const apkUser =
      await prisma.$transaction(
        async (tx) => {
          const createdUser =
            await tx.apkUser.create({
              data: {
                ...userData,

                passwordHash,

                expiresAt:
                  data.expiresAt
                    ? new Date(
                      `${data.expiresAt}T23:59:59.999Z`,
                    )
                    : null,

                notes:
                  data.notes?.trim() ||
                  null,
              },
            });

          if (
            permissions.length > 0
          ) {
            await tx.apkUserPermission.createMany(
              {
                data: permissions.map(
                  (permission) => ({
                    apkUserId:
                      createdUser.id,

                    permissionId:
                      permission.permissionId,

                    allowed:
                      permission.allowed,
                  }),
                ),
              },
            );
          }

          return createdUser;
        },
      );

    return NextResponse.json(
      {
        apkUser,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar usuário APK:",
      error,
    );

    if (
      error instanceof z.ZodError
    ) {
      return NextResponse.json(
        {
          error:
            error.issues[0]
              ?.message ||
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
          "Não foi possível cadastrar o usuário.",
      },
      {
        status: 400,
      },
    );
  }
}