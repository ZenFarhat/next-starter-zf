import { SelectUser } from "@/db/schema"

export const checkUserSubscribed = (user: SelectUser | null): boolean => {
  if (!user) return false

  if (user.override_subscription) return true

  const now = new Date()
  const cancelledAt = user.cancelled_at ? new Date(user.cancelled_at) : null

  if (user.subscribed_at && (!cancelledAt || now <= cancelledAt)) {
    return true
  }

  if (!user.stripe_customer_id) {
    return false
  }

  return false
}
