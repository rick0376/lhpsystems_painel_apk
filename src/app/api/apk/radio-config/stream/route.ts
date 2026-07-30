import { NextResponse } from "next/server";
import { authorizeApkRequest } from "../../../../../lib/auth/apk-session";
import { prisma } from "../../../../../lib/prisma";
import { decryptRadioSecret } from "../../../../../lib/security/radio-config-crypto";

export async function POST(request: Request) {
  const authorization = await authorizeApkRequest(request);

  if (authorization.ok === false) {
    return NextResponse.json(
      { allowed: false, error: authorization.error },
      {
        status: authorization.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (!authorization.user.canTransmit) {
    return NextResponse.json(
      { allowed: false, error: "Este usuário não pode iniciar transmissões." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const config = await prisma.radioStreamConfig.findUnique({
    where: { projectId: authorization.project.id },
  });

  if (!config) {
    return NextResponse.json(
      {
        allowed: false,
        error: "A configuração da rádio ainda não foi cadastrada no painel.",
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!config.enabled) {
    return NextResponse.json(
      { allowed: false, error: "A transmissão está desativada no painel." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    return NextResponse.json(
      {
        allowed: true,
        config: {
          host: config.host,
          sourcePort: config.sourcePort,
          sourceUsername: config.sourceUsername,
          sourcePassword: decryptRadioSecret(
            config.sourcePasswordEncrypted,
          ),
          mountPoint: config.mountPoint,
          useTls: config.useTls,
          bitrate: config.bitrate,
          sampleRate: config.sampleRate,
          channels: config.channels,
          version: config.version,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        error:
          "A credencial da rádio não pôde ser aberta. Verifique a chave de criptografia do painel.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
