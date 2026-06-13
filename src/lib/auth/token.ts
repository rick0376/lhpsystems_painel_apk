// src/lib/auth/token.ts

import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET não configurado no .env");
}

const secretKey = new TextEncoder().encode(secret);

export type AdminTokenPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function createAdminToken(payload: AdminTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);

  return payload as AdminTokenPayload;
}
