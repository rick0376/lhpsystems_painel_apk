// src/app/api/projects/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function normalizeWhatsappNumber(
  label?: string | null,
  number?: string | null,
) {
  const raw = onlyDigits(number || label);

  if (!raw) return "";
  if (raw.startsWith("55")) return raw;
  if (raw.length === 10 || raw.length === 11) return `55${raw}`;

  return raw;
}

const createProjectSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  slug: z
    .string()
    .min(2, "Slug precisa ter no mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  appKey: z.string().min(4, "App Key precisa ter no mínimo 4 caracteres"),
  description: z.string().optional(),
  supportWhatsappLabel: z.string().optional(),
  supportWhatsappNumber: z.string().optional(),
  supportWhatsappMessage: z.string().optional(),
  active: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const projectWithSameSlug = await prisma.appProject.findUnique({
      where: { slug: data.slug },
    });

    if (projectWithSameSlug) {
      return NextResponse.json(
        { error: "Já existe um projeto cadastrado com esse slug." },
        { status: 400 },
      );
    }

    const projectWithSameAppKey = await prisma.appProject.findUnique({
      where: { appKey: data.appKey },
    });

    if (projectWithSameAppKey) {
      return NextResponse.json(
        { error: "Já existe um projeto cadastrado com essa App Key." },
        { status: 400 },
      );
    }

    const supportWhatsappLabel = data.supportWhatsappLabel?.trim() || null;
    const supportWhatsappNumber =
      normalizeWhatsappNumber(
        data.supportWhatsappLabel,
        data.supportWhatsappNumber,
      ) || null;

    const project = await prisma.appProject.create({
      data: {
        name: data.name,
        slug: data.slug,
        appKey: data.appKey,
        description: data.description || null,
        supportWhatsappLabel,
        supportWhatsappNumber,
        supportWhatsappMessage: data.supportWhatsappMessage?.trim() || null,
        active: data.active,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Dados inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível cadastrar o projeto." },
      { status: 400 },
    );
  }
}
