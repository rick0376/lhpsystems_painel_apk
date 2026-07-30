import { prisma } from "../prisma";
import { readBearerToken, verifyApkToken } from "./apk-token";

export type ApkAuthorizationResult =
  | {
      ok: true;
      user: NonNullable<Awaited<ReturnType<typeof findAuthorizedContext>>["user"]>;
      project: NonNullable<Awaited<ReturnType<typeof findAuthorizedContext>>["project"]>;
      device: NonNullable<Awaited<ReturnType<typeof findAuthorizedContext>>["device"]>;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

async function findAuthorizedContext(
  userId: string,
  projectId: string,
  deviceId: string,
) {
  const user = await prisma.apkUser.findFirst({
    where: { id: userId, projectId },
    include: { project: true },
  });

  const device = user
    ? await prisma.device.findUnique({
        where: {
          apkUserId_deviceId: {
            apkUserId: user.id,
            deviceId,
          },
        },
      })
    : null;

  return {
    user,
    project: user?.project || null,
    device,
  };
}

export async function authorizeApkRequest(
  request: Request,
): Promise<ApkAuthorizationResult> {
  const token = readBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Sessão do aplicativo não informada.",
    };
  }

  try {
    const payload = await verifyApkToken(token);
    const context = await findAuthorizedContext(
      payload.userId,
      payload.projectId,
      payload.deviceId,
    );

    if (!context.user || !context.project) {
      return { ok: false, status: 401, error: "Sessão inválida." };
    }

    if (!context.project.active) {
      return { ok: false, status: 403, error: "Aplicativo bloqueado." };
    }

    if (!context.user.active) {
      return { ok: false, status: 403, error: "Usuário bloqueado." };
    }

    if (context.user.expiresAt && context.user.expiresAt < new Date()) {
      return { ok: false, status: 403, error: "Licença expirada." };
    }

    if (!context.device) {
      return {
        ok: false,
        status: 403,
        error: "Dispositivo não autorizado.",
      };
    }

    if (!context.device.active) {
      return {
        ok: false,
        status: 403,
        error: "Este dispositivo está bloqueado.",
      };
    }

    return {
      ok: true,
      user: context.user,
      project: context.project,
      device: context.device,
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Sessão expirada. Faça login novamente.",
    };
  }
}
