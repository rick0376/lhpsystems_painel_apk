// src/app/api/apk/support/route.ts

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const DEFAULT_SUPPORT_LABEL = "(12) 991890682";
const DEFAULT_SUPPORT_NUMBER = "5512991890682";
const DEFAULT_SUPPORT_MESSAGE =
  "Olá, preciso de ajuda com meu acesso ao aplicativo.";

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function buildSupport(project: {
  supportWhatsappLabel?: string | null;
  supportWhatsappNumber?: string | null;
  supportWhatsappMessage?: string | null;
}) {
  const whatsappLabel =
    project.supportWhatsappLabel?.trim() ||
    DEFAULT_SUPPORT_LABEL;

  const rawNumber =
    onlyDigits(project.supportWhatsappNumber) ||
    onlyDigits(project.supportWhatsappLabel) ||
    DEFAULT_SUPPORT_NUMBER;

  const whatsappNumber = rawNumber.startsWith("55")
    ? rawNumber
    : rawNumber.length === 10 || rawNumber.length === 11
      ? `55${rawNumber}`
      : rawNumber;

  const whatsappMessage =
    project.supportWhatsappMessage?.trim() ||
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const appKey = searchParams.get("appKey")?.trim();

    if (!appKey) {
      return NextResponse.json(
        { error: "App Key obrigatória." },
        { status: 400 },
      );
    }

    const project = await prisma.appProject.findFirst({
      where: {
        appKey: {
          equals: appKey,
          mode: "insensitive",
        },
        active: true,
      },

      select: {
        supportWhatsappLabel: true,
        supportWhatsappNumber: true,
        supportWhatsappMessage: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Aplicativo não autorizado." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        support: buildSupport(project),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao buscar suporte:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar o suporte.",
      },
      { status: 500 },
    );
  }
}