import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { supabase } from "../lib/supabase";

const router = Router();

// POST /api/webhooks/clerk
// Raw body needed for svix signature verification — mount BEFORE express.json()
router.post("/clerk", async (req: Request, res: Response) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] CLERK_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  let payload: any;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const { type, data } = payload as { type: string; data: any };
  console.log(`[webhook] Event: ${type}`);

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address ?? null;
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
    const avatar = data.image_url ?? null;

    const { error } = await supabase.from("users").upsert(
      { id: data.id, email, name, avatar_url: avatar },
      { onConflict: "id" }
    );

    if (error) {
      console.error("[webhook] Supabase upsert error:", error);
      res.status(500).json({ error: error.message });
      return;
    }
    console.log(`[webhook] User upserted: ${data.id} (${email})`);
  }

  if (type === "user.deleted") {
    const { error } = await supabase.from("users").delete().eq("id", data.id);
    if (error) console.error("[webhook] Delete error:", error);
    else console.log(`[webhook] User deleted: ${data.id}`);
  }

  res.json({ received: true });
});

export default router;
