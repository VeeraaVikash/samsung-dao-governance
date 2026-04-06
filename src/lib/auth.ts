import { db } from "./db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireRole(role: "ADMIN" | "COUNCIL" | "MEMBER") {
  const user = await getSession();
  if (!user || user.role !== role) redirect("/auth/login");
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function destroySession(token: string) {
  await db.session.delete({ where: { token } }).catch(() => {});
}
