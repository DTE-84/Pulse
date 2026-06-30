import { Request, Response } from "express";
import Stripe from "stripe";
import { query } from "../db/db.js";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
  apiVersion: "2023-10-16" as any,
}) : null;

export const createCheckoutSession = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  if (!stripe) {
    return res.status(503).json({ 
      message: "Payment Uplink Offline", 
      detail: "Stripe API Key is missing from the environment. Secure payments are currently disabled." 
    });
  }

  const { planName, isAnnual } = req.body;

  // 1. Fetch User Context for Stripe Customer Mapping
  let user;
  try {
    const userRes = await query(
      "SELECT email, user_name, stripe_customer_id FROM dim_users WHERE user_id = $1",
      [userId]
    );
    user = userRes.rows[0];
  } catch (dbErr: any) {
    console.error("[Stripe] DB Error (Customer Check):", dbErr.message);
  }

  if (!user) return res.status(404).json({ message: "User not found." });

  let customerId = user.stripe_customer_id;

  // 2. Deterministic Customer Initialization
  if (!customerId) {
    try {
      console.log(`[Stripe] Initializing new customer identity for: ${user.email}`);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_name,
        metadata: { userId },
      });
      customerId = customer.id;

      await query(
        "UPDATE dim_users SET stripe_customer_id = $1 WHERE user_id = $2",
        [customerId, userId]
      );
    } catch (stripeErr: any) {
      console.error("[Stripe] Customer Creation Failed:", stripeErr.message);
      // Continue without customerId if it fails, Checkout can handle guest email
    }
  }

  // High-Fidelity Price Mapping
  const prices: Record<string, string> = {
    "Elite_Monthly": process.env.STRIPE_PRICE_ELITE_MONTHLY || "",
    "Elite_Annual": process.env.STRIPE_PRICE_ELITE_ANNUAL || "",
    "Pro_Monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    "Pro_Annual": process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  };

  const priceKey = `${planName}_${isAnnual ? "Annual" : "Monthly"}`;
  const priceId = prices[priceKey];

  if (!priceId && process.env.NODE_ENV === "production") {
    return res.status(400).json({ message: "Invalid plan selection or price ID missing." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || "price_dummy_for_dev", // Fallback for dev testing
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.APP_BASE_URL || "http://localhost:5173"}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5173"}/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        planName,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] Checkout Error:", err.message);
    res.status(500).json({ message: "Could not establish secure payment uplink." });
  }
};
