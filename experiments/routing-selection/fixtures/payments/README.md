# shop-payments (fixture)

A small checkout backend used as the working directory of diagram measurements. It is not a real service.

- `gateway/` — API gateway: authenticates the request and forwards `POST /checkout` to the order service.
- `orders/` — order service: creates the order, asks the payment client to charge it, then confirms or cancels.
- `payments/` — payment client: calls the external payment provider (PSP) and handles its webhook.
