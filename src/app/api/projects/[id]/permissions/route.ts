// src/app/api/projects/[id]/permissions/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

type RouteProps = {
    params: Promise<{
        id: string;
    }>;
};

const createPermissionSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Informe o nome da permissão."),

    key: z
        .string()
        .trim()
        .min(2, "Informe a chave da permissão.")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "A chave deve usar apenas letras, números e underline.",
        ),

    description: z
        .string()
        .trim()
        .optional(),
});

/* =========================================================
   LISTAR PERMISSÕES DO PROJETO
========================================================= */

export async function GET(
    _request: Request,
    { params }: RouteProps,
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

    const { id } =
        await params;

    const project =
        await prisma.appProject.findUnique({
            where: {
                id,
            },

            select: {
                id: true,
                name: true,

                permissions: {
                    orderBy: {
                        name: "asc",
                    },
                },
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

    return NextResponse.json({
        project: {
            id: project.id,
            name: project.name,
        },

        permissions:
            project.permissions,
    });
}

/* =========================================================
   CRIAR PERMISSÃO
========================================================= */

export async function POST(
    request: Request,
    { params }: RouteProps,
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
        const { id } =
            await params;

        const body =
            await request.json();

        const data =
            createPermissionSchema.parse(
                body,
            );

        const project =
            await prisma.appProject.findUnique({
                where: {
                    id,
                },

                select: {
                    id: true,
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

        const existing =
            await prisma.appPermission.findUnique({
                where: {
                    projectId_key: {
                        projectId: id,
                        key: data.key,
                    },
                },
            });

        if (existing) {
            return NextResponse.json(
                {
                    error:
                        "Este projeto já possui uma permissão com essa chave.",
                },
                {
                    status: 400,
                },
            );
        }

        const permission =
            await prisma.appPermission.create({
                data: {
                    projectId: id,

                    name:
                        data.name,

                    key:
                        data.key,

                    description:
                        data.description ||
                        null,
                },
            });

        return NextResponse.json(
            {
                permission,
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        if (
            error instanceof
            z.ZodError
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

        console.error(
            "Erro ao criar permissão:",
            error,
        );

        return NextResponse.json(
            {
                error:
                    "Não foi possível criar a permissão.",
            },
            {
                status: 500,
            },
        );
    }
}