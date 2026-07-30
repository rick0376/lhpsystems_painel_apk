import { jwtVerify, SignJWT } from "jose";

const APK_TOKEN_TTL_SECONDS = 12 * 60 * 60;

function getSecretKey() {
  const secret = process.env.APK_JWT_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("APK_JWT_SECRET ou JWT_SECRET não configurado no .env");
  }

  return new TextEncoder().encode(secret);
}

export type ApkTokenPayload = {
  userId: string;
  projectId: string;
  deviceId: string;
};

export async function createApkToken(payload: ApkTokenPayload) {
  const token = await new SignJWT({
    type: "apk",
    projectId: payload.projectId,
    deviceId: payload.deviceId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${APK_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());

  return {
    token,
    expiresInSeconds: APK_TOKEN_TTL_SECONDS,
  };
}

export async function verifyApkToken(token: string): Promise<ApkTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());

  if (
    payload.type !== "apk" ||
    typeof payload.sub !== "string" ||
    typeof payload.projectId !== "string" ||
    typeof payload.deviceId !== "string"
  ) {
    throw new Error("Token do aplicativo inválido.");
  }

  return {
    userId: payload.sub,
    projectId: payload.projectId,
    deviceId: payload.deviceId,
  };
}

export function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}
