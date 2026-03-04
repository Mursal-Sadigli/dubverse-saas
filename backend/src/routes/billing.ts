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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl || process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${returnUrl || process.env.FRONTEND_URL}/pricing`,
      customer_email: email,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks/stripe — Stripe webhook handler
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,           // raw body (must be mounted with express.raw)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err.message);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: "pro",
        minutes_limit: 120,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .single();

    if (existing) {
      await supabase.from("subscriptions").update({
        plan: "free",
        minutes_limit: 20,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", existing.user_id);
    }
  }

  res.json({ received: true });
});

export default router;
