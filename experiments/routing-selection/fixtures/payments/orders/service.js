// Order service: creates a pending order, charges it through the payment client, then confirms or cancels it.
import { paymentClient } from "../payments/client.js";

const orders = new Map();

export const orderService = {
  async checkout({ userId, cart, idempotencyKey }) {
    const order = { id: `ord_${orders.size + 1}`, userId, total: cart.reduce((n, item) => n + item.price * item.qty, 0), status: "pending" };
    orders.set(order.id, order);
    const charge = await paymentClient.charge({ orderId: order.id, amount: order.total, idempotencyKey });
    if (charge.status === "succeeded") {
      order.status = "confirmed";
    } else if (charge.status === "requires_action") {
      order.status = "awaiting_3ds"; // the PSP webhook finishes it later
    } else {
      order.status = "cancelled";
    }
    return { ok: order.status !== "cancelled", orderId: order.id, status: order.status, redirectUrl: charge.redirectUrl };
  },
  async onPaymentEvent(event) {
    const order = orders.get(event.orderId);
    if (order) order.status = event.type === "payment.succeeded" ? "confirmed" : "cancelled";
  },
};
