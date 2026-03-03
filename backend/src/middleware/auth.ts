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

  // Track subscription details
  let sub = { plan: "free", minutes_used: 0, minutes_limit: 20 };
  try {
    const { data } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single();
    if (data) sub = { plan: data.plan, minutes_used: data.minutes_used, minutes_limit: data.minutes_limit };
  } catch (err: any) {
    if (err.code !== 'PGRST116') { // PGRST116 is not found, which is fine
      console.error("[auth] Subscription fetch error:", err.message);
    }
  }

  // Prevent actions if limit is reached (only for POST/PUT/DELETE requests that cost usage)
  // We'll apply this logic to the transcribe route separately, or just universally for now:
  if (req.method !== 'GET' && sub.minutes_used >= sub.minutes_limit) {
     res.status(403).json({ error: "Usage limit exceeded. Please upgrade your plan." });
     return;
  }
  
  (req as any).subscription = sub;

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
