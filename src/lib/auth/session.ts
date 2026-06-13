// src/lib/auth/session.ts

import { cookies } from "next/headers";
import { verifyAdminToken, type AdminTokenPayload } from "./token";

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("lhp_admin_token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyAdminToken(token);

    return payload;
  } catch {
    return null;
  }
}
