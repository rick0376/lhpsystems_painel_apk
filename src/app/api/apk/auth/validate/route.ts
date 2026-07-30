import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApkRequest } from "../../../../../lib/auth/apk-session";
import { createApkToken } from "../../../../../lib/auth/apk-token";
import { prisma } from "../../../../../lib/prisma";

const validateBodySchema = z.object({
  deviceName: z.string().trim().max(200).optional(),
});

async function readBody(request: Request) {
  try {
    return validateBodySchema.parse(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) return {};
    throw error;
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await readBody(request);
    const now = new Date();

    await prisma.device.update({
      where: { id: authorization.device.id },
      data: {
        deviceName: body.deviceName || authorization.device.deviceName,
        lastAccessAt: now,
      },
    });

    const access = await createApkToken({
      userId: authorization.user.id,
      projectId: authorization.project.id,
      deviceId: authorization.device.deviceId,
    });

    return NextResponse.json(
      {
        allowed: true,
        accessToken: access.token,
        expiresInSeconds: access.expiresInSeconds,
        user: {
          id: authorization.user.id,
          name: authorization.user.name,
          username: authorization.user.username,
          expiresAt: authorization.user.expiresAt,
          canTransmit: authorization.user.canTransmit,
          canOpenSettings: authorization.user.canOpenSettings,
          canEditRadioConfig: false,
          maxDevices: authorization.user.maxDevices,
        },
        project: {
          id: authorization.project.id,
          name: authorization.project.name,
          slug: authorization.project.slug,
          appKey: authorization.project.appKey,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { allowed: false, error: error.issues[0]?.message || "Dados inválidos." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { allowed: false, error: "Não foi possível validar a licença." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
