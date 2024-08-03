import { db } from "@/db"
import { usersTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const stripe = new Stripe(process.env.STRIPE_SK!)

const handleCompletedCheckoutSession = async (event: Stripe.InvoicePaymentSucceededEvent) => {
  try {
    const customerId = event.data.object?.customer
    const getCustomer = await stripe.customers.retrieve(customerId as string)
    const email: string = (getCustomer as any).email

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email))

    await db
      .insert(usersTable)
      .values({ ...user, subscribed_at: new Date() })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { subscribed_at: new Date(), cancelled_at: null, stripe_customer_id: customerId as string },
      })

    return true
  } catch (err: any) {
    console.error(err)
    return false
  }
}

const handleCustomerSubscriptionUpdated = async (event: Stripe.CustomerSubscriptionUpdatedEvent) => {
  try {
    const customerId = event.data.object?.customer
    const getCustomer = await stripe.customers.retrieve(customerId as string)
    const email: string = (getCustomer as any).email
    const subscriptionCancel = event.data.object?.cancel_at ? new Date(event.data.object?.cancel_at * 1000) : null

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email))

    await db
      .insert(usersTable)
      .values({ ...user, cancelled_at: subscriptionCancel })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { cancelled_at: subscriptionCancel },
      })

    return true
  } catch (err: any) {
    console.error(err)
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  switch (event.type) {
    case "invoice.payment_succeeded":
      const session = await handleCompletedCheckoutSession(event)
      if (!session) {
        return NextResponse.json({ error: "Could not process session" }, { status: 400 })
      }
      break
    case "customer.subscription.updated":
      const updated = await handleCustomerSubscriptionUpdated(event)
      if (!updated) {
        return NextResponse.json({ error: "Could not process subscription" }, { status: 400 })
      }
  }

  return NextResponse.json({ received: true })
}
