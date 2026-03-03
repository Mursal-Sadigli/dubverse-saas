import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { supabase } from "../lib/supabase";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;

  // Upsert user into Supabase on every request (idempotent)
  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses?.[0]?.emailAddress ?? null;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    const avatar = user.imageUrl ?? null;

    await supabase.from("users").upsert(
      { id: userId, email, name, avatar_url: avatar },
      { onConflict: "id" }
    );
  } catch (err) {
    // Non-fatal — don't block the request if upsert fails
    console.error("[auth] User upsert failed:", err);
  }

  next();
}
