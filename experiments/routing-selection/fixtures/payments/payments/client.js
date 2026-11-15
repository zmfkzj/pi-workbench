// Payment client: calls the external payment provider (PSP) with an idempotency key and verifies its webhooks.
const PSP_URL = "https://psp.example.com/v1/charges";

export const paymentClient = {
  async charge({ orderId, amount, idempotencyKey }) {
    const response = await fetch(PSP_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({ reference: orderId, amount, currency: "KRW" }),
    });
    if (!response.ok) return { status: "failed" };
    return response.json(); // { status: "succeeded" | "requires_action" | "failed", redirectUrl? }
  },
};

// POST /webhooks/psp — the PSP reports the 3-D Secure outcome asynchronously.
export async function handlePspWebhook(req, { orderService, verifySignature }) {
  if (!verifySignature(req)) return { status: 400 };
  await orderService.onPaymentEvent({ orderId: req.body.reference, type: req.body.type });
  return { status: 204 };
}
