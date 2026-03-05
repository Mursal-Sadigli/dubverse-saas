import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/auth";
import { supabase } from "../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

const router = Router();

// GET /api/billing/usage — current user's subscription and usage
router.get("/usage", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) {
      // Return default free plan values
      res.json({ plan: "free", minutesUsed: 0, minutesLimit: 20 });
      return;
    }
    res.json({
      plan: data.plan,
      minutesUsed: data.minutes_used,
      minutesLimit: data.minutes_limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/checkout — create Stripe Checkout session
router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { email, returnUrl } = req.body;

    console.log(`[STRIPE] Creating checkout session for user: ${userId}, email: ${email}`);
    console.log(`[STRIPE] Key status: ${process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING"}`);
    console.log(`[STRIPE] Price ID status: ${process.env.STRIPE_PRO_PRICE_ID ? "SET" : "MISSING"}`);

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
      throw new Error("Stripe configuration is missing (Secret Key or Price ID)");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl || process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${returnUrl || process.env.FRONTEND_URL}/pricing`,
      customer_email: email,
      metadata: { userId },
    });

    console.log(`[STRIPE] Session created successfully: ${session.url}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error(`[STRIPE] Checkout error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks/stripe — Stripe webhook handler
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    console.log(`[STRIPE-WEBHOOK] Received event. Sig present: ${!!sig}, Secret present: ${!!process.env.STRIPE_WEBHOOK_SECRET}`);
    
    event = stripe.webhooks.constructEvent(
      req.body,           // raw body (must be mounted with express.raw)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[STRIPE-WEBHOOK] Signature error:", err.message);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  console.log(`[STRIPE-WEBHOOK] Event Type: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    console.log(`[STRIPE-WEBHOOK] Completed session for userId: ${userId}`);

    if (userId) {
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: "pro",
        minutes_limit: 120,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) {
        console.error(`[STRIPE-WEBHOOK] Database error during upsert:`, error.message);
      } else {
        console.log(`[STRIPE-WEBHOOK] Successfully upgraded user ${userId} to Pro`);
      }
    } else {
      console.warn(`[STRIPE-WEBHOOK] No userId found in session metadata!`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    console.log(`[STRIPE-WEBHOOK] Subscription deleted: ${sub.id}`);

    const { data: existing, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .single();

    if (fetchErr) {
      console.error(`[STRIPE-WEBHOOK] Error finding subscription for deletion:`, fetchErr.message);
    }

    if (existing) {
      const { error: updateErr } = await supabase.from("subscriptions").update({
        plan: "free",
        minutes_limit: 20,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", existing.user_id);

      if (updateErr) {
        console.error(`[STRIPE-WEBHOOK] Error updating record on deletion:`, updateErr.message);
      } else {
        console.log(`[STRIPE-WEBHOOK] Successfully downgraded user ${existing.user_id} back to free`);
      }
    }
  }

  res.json({ received: true });
});

export default router;
