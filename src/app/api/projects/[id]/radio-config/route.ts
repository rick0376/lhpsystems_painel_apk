import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";
import { encryptRadioSecret } from "../../../../../lib/security/radio-config-crypto";

type RouteProps = {
  params: Promise<{ id: string }>;
};

const radioConfigSchema = z.object({
  host: z
    .string()
    .trim()
    .min(3, "Informe o host da rádio.")
    .max(255)
    .refine((value) => !value.includes("://") && !/[\s/]/.test(value), {
      message: "Informe somente o host, sem http://, https:// ou caminho.",
    }),
  sourcePort: z.number().int().min(1).max(65535),
  publicPort: z.number().int().min(1).max(65535).nullable(),
  playerUrl: z.union([z.string().url("URL do player inválida."), z.literal("")]),
  sourceUsername: z
    .string()
    .trim()
    .min(1, "Informe o usuário DJ.")
    .max(120),
  sourcePassword: z.string().max(500).optional(),
  mountPoint: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((value) => value.startsWith("/"), {
      message: "O mount point precisa começar com /.",
    }),
  useTls: z.boolean(),
  enabled: z.boolean(),
  bitrate: z.number().int().refine((value) => [64, 96, 128, 192, 256, 320].includes(value), {
    message: "Bitrate inválido.",
  }),
  sampleRate: z.number().int().refine((value) => [22050, 44100, 48000].includes(value), {
    message: "Taxa de amostragem inválida.",
  }),
  channels: z.number().int().refine((value) => value === 1 || value === 2, {
    message: "Quantidade de canais inválida.",
  }),
});

export async function PUT(request: Request, { params }: RouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = radioConfigSchema.parse(await request.json());
    const project = await prisma.appProject.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado." },
        { status: 404 },
      );
    }

    const currentConfig = await prisma.radioStreamConfig.findUnique({
      where: { projectId: id },
    });
    const newPassword = data.sourcePassword?.trim();

    if (!currentConfig && !newPassword) {
      return NextResponse.json(
        { error: "Informe a senha DJ no primeiro cadastro." },
        { status: 400 },
      );
    }

    const sourcePasswordEncrypted = newPassword
      ? encryptRadioSecret(newPassword)
      : currentConfig!.sourcePasswordEncrypted;

    const commonData = {
      host: data.host,
      sourcePort: data.sourcePort,
      publicPort: data.publicPort,
      playerUrl: data.playerUrl.trim() || null,
      sourceUsername: data.sourceUsername,
      sourcePasswordEncrypted,
      mountPoint: data.mountPoint,
      useTls: data.useTls,
      enabled: data.enabled,
      bitrate: data.bitrate,
      sampleRate: data.sampleRate,
      channels: data.channels,
    };

    const config = await prisma.radioStreamConfig.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        ...commonData,
      },
      update: {
        ...commonData,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        host: config.host,
        sourcePort: config.sourcePort,
        publicPort: config.publicPort,
        playerUrl: config.playerUrl,
        sourceUsername: config.sourceUsername,
        mountPoint: config.mountPoint,
        useTls: config.useTls,
        enabled: config.enabled,
        bitrate: config.bitrate,
        sampleRate: config.sampleRate,
        channels: config.channels,
        version: config.version,
        credentialConfigured: true,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Dados inválidos." },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("RADIO_CONFIG_ENCRYPTION_KEY")
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Não foi possível salvar a configuração da rádio." },
      { status: 500 },
    );
  }
}
