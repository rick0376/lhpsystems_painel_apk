import { NextResponse } from "next/server";
import { authorizeApkRequest } from "../../../../lib/auth/apk-session";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
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

  if (!authorization.user.canOpenSettings) {
    return NextResponse.json(
      { allowed: false, error: "Acesso às configurações bloqueado." },
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

  return NextResponse.json(
    {
      allowed: true,
      config: {
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
        updatedAt: config.updatedAt,
        credentialConfigured: Boolean(config.sourcePasswordEncrypted),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
