// src/app/api/projects/[id]/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";

type ProjectRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateProjectSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").optional(),
  slug: z
    .string()
    .min(2, "Slug precisa ter no mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen")
    .optional(),
  appKey: z
    .string()
    .min(4, "App Key precisa ter no mínimo 4 caracteres")
    .optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: ProjectRouteProps) {
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

    const data = updateProjectSchema.parse(body);

    const project = await prisma.appProject.findUnique({
      where: {
        id,
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

    if (data.slug) {
      const projectWithSameSlug = await prisma.appProject.findFirst({
        where: {
          id: {
            not: id,
          },
          slug: data.slug,
        },
      });

      if (projectWithSameSlug) {
        return NextResponse.json(
          {
            error: "Já existe outro projeto cadastrado com esse slug.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (data.appKey) {
      const projectWithSameAppKey = await prisma.appProject.findFirst({
        where: {
          id: {
            not: id,
          },
          appKey: data.appKey,
        },
      });

      if (projectWithSameAppKey) {
        return NextResponse.json(
          {
            error: "Já existe outro projeto cadastrado com essa App Key.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const updatedProject = await prisma.appProject.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        appKey: data.appKey,
        description:
          data.description !== undefined ? data.description || null : undefined,
        active: data.active,
      },
    });

    return NextResponse.json({
      project: updatedProject,
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
        error: "Não foi possível atualizar o projeto.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(_request: Request, { params }: ProjectRouteProps) {
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

    const project = await prisma.appProject.findUnique({
      where: {
        id,
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

    await prisma.appProject.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Projeto excluído com sucesso.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível excluir o projeto.",
      },
      {
        status: 400,
      },
    );
  }
}
