import { Request, Response } from "express";
import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
  apiVersion: "2023-10-16" as any,
}) : null;

export const createCheckoutSession = async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: "Payment Uplink Offline", 
      detail: "Stripe API Key is missing from the environment. Secure payments are currently disabled." 
    });
  }
  const { planName, isAnnual } = req.body;
  const userId = req.userId;

  if (!userId) return res.status(401).json({ message: "Authentication required." });

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
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || "price_dummy_for_dev", // Fallback for dev testing
          quantity: 1,
        },
      ],
      mode: "subscription",
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
