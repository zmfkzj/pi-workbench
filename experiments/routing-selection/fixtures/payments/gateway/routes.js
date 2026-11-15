// API gateway: authenticates the caller and forwards checkout requests to the order service.
import { verifyToken } from "./auth.js";
import { orderService } from "../orders/service.js";

export async function handleCheckout(req) {
  const user = await verifyToken(req.headers.authorization);
  if (!user) return { status: 401 };
  const result = await orderService.checkout({ userId: user.id, cart: req.body.cart, idempotencyKey: req.headers["idempotency-key"] });
  return { status: result.ok ? 201 : 402, body: result };
}
