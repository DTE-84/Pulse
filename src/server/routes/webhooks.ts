import { Request, Response } from "express";
import Stripe from "stripe";
import { query } from "../db/db.js";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
  apiVersion: "2023-10-16" as any,
}) : null;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not initialized — missing STRIPE_SECRET_KEY.");
    return res.status(503).json({ message: "Payment system offline." });
  }

  if (!WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET missing — cannot verify signature.");
    return res.status(500).json({ message: "Webhook secret not configured." });
  }

  // 1. Verify the signal is actually from Stripe (prevents fake payment injection)
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    // req.body must be raw Buffer here — ensured by express.raw() in server index
    event = stripe.webhooks.constructEvent(req.body, sig as string, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook signal rejected: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Event received: ${event.type}`);

  try {
    switch (event.type) {

      // 2. Subscription activated after successful payment
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId) {
          console.error("[Stripe Webhook] No userId in client_reference_id.");
          break;
        }

        // Fetch subscription details to get period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const planName = session.metadata?.planName || "Elite";

        await query(
          `UPDATE dim_users SET
            subscription_status = 'active',
            subscription_tier = $1,
            stripe_customer_id = $2,
            stripe_subscription_id = $3,
            trial_ends_at = NULL,
            subscription_ends_at = $4,
            updated_at = NOW()
           WHERE user_id = $5`,
          [planName, customerId, subscriptionId, periodEnd, userId]
        );

        console.log(`[Stripe Webhook] ✅ Subscription activated for user: ${userId}`);
        break;
      }

      // 3. Subscription renewed successfully
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await query(
          `UPDATE dim_users SET
            subscription_status = 'active',
            subscription_ends_at = $1,
            updated_at = NOW()
           WHERE stripe_subscription_id = $2`,
          [periodEnd, subscriptionId]
        );

        console.log(`[Stripe Webhook] ✅ Renewal confirmed for subscription: ${subscriptionId}`);
        break;
      }

      // 4. Payment failed — grace period, don't kill access yet
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        await query(
          `UPDATE dim_users SET
            subscription_status = 'past_due',
            updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subscriptionId]
        );

        console.warn(`[Stripe Webhook] ⚠️ Payment failed for subscription: ${subscriptionId}`);
        break;
      }

      // 5. Subscription cancelled or fully expired
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await query(
          `UPDATE dim_users SET
            subscription_status = 'expired',
            subscription_ends_at = NOW(),
            updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );

        console.log(`[Stripe Webhook] 🔴 Subscription terminated: ${subscription.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Always return 200 — Stripe will retry if it doesn't get this
    res.json({ received: true });

  } catch (err: any) {
    console.error("[Stripe Webhook] Handler error:", err.message);
    // Still return 200 to prevent Stripe retry storms on permanent errors
    res.json({ received: true });
  }
};
