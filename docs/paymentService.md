# Payment service methods

Source: [payment.service.ts](../src/modules/payment/payment.service.ts)

## Methods and their purpose

- **`getPayableBookingFromDB`** — Checks whether a customer's booking can be paid.
- **`createPaymentIntoDB`** — Creates a pending payment and returns a Stripe Checkout link. **Critical: transaction and Stripe call.**
- **`completePaymentIntoDB`** — Marks a confirmed payment as completed and its booking as paid. **Critical: transaction.**
- **`closePendingPaymentIntoDB`** — Marks a pending payment as failed or cancelled. **Critical: conditional update.**
- **`refundCancelledBookingPaymentIntoDB`** — Requests a refund for a payment whose booking is cancelled. **Critical: external refund request.**
- **`updateRefundStatusIntoDB`** — Saves a refund result reported by Stripe.
- **`getMyPaymentsFromDB`** — Lists the signed-in customer's payments.
- **`getPaymentByIdFromDB`** — Gets one payment belonging to the signed-in customer.
- **`refundCancelledPaidBookingIntoDB`** — Finds a cancelled booking's payment and starts its refund. **Critical: called after the booking transaction.**

## Method flows

### 1. `getPayableBookingFromDB`

1. **Start:** `createPaymentIntoDB` gives this method a customer ID and booking ID. The customer ID originally came from authentication; the booking ID came from the customer's request body.
2. Find a booking with **both** of those IDs.
3. If no booking is found, stop with “Booking not found.”
4. If the booking already has a `COMPLETED` payment, stop because it has already been paid.
5. If the booking is not `ACCEPTED`, stop because it is not ready for payment.
6. If the saved booking price is zero or less, stop because the amount is invalid.
7. Return the booking, customer email, and service title to `createPaymentIntoDB`.

### 2. `createPaymentIntoDB` — **CRITICAL: transaction + Stripe call**

**Before the transaction**

1. **Start:** The payment controller passes the signed-in customer ID and validated body from `POST /api/payments/create`.
2. Call `getPayableBookingFromDB`. If it reports an error, stop.
3. Read the requested provider. If none was given, use `STRIPE`.
4. Ask the provider factory for that provider's implementation. If it is unsupported, stop.

**Database transaction**

1. Start a transaction with `Serializable` isolation. This helps when two requests try to pay for the same booking at nearly the same time.
2. Find the booking again. If it is no longer `ACCEPTED`, stop.
3. Find a `PENDING` payment for that booking. If one exists, stop.
4. Create a new payment with the booking's saved price and `PENDING` status.
5. Finish the transaction. If the database detects a transaction conflict, return a `409` error.

**After the transaction: external Stripe call**

1. Send the payment ID, booking details, amount, and BDT currency to the provider's `createCheckoutSession` method.
2. If Stripe fails, change the new payment to `FAILED` and pass the error back to the controller.
3. If Stripe succeeds, save its session ID on the payment.
4. Return `{ paymentId, checkoutUrl }` to the controller, which sends them to the customer.

**Why these parts are separate**

1. Finish the database transaction first.
2. Then wait for Stripe. This avoids keeping a database transaction open during an external network request.

### 3. `completePaymentIntoDB` — **CRITICAL: transaction**

**Input**

1. **Start:** Stripe sends a payment success event.
2. The webhook handler verifies the event and passes its payment ID, booking ID, provider, Stripe session ID, paid amount, and currency to this method.
3. If the currency is not BDT, stop.

**Database transaction**

1. Start a transaction and find the payment together with its booking status.
2. If the payment is missing, or its booking ID or provider differs from the event, stop.
3. If the paid amount differs from the saved amount, stop.
4. If a Stripe session ID is already saved and it differs from the event's session ID, stop.
5. If this payment is already `COMPLETED` and its booking is `PAID` or further along, return the saved payment. A repeated Stripe event needs no second update.
6. Otherwise, if the payment is not `PENDING` or the booking is not `ACCEPTED`, stop with a conflict error.
7. Change the payment to `COMPLETED`. If another request changed it first, stop.
8. Change the booking to `PAID`. If another request changed it first, stop.
9. If any step fails, roll back **both** updates. If both succeed, finish the transaction and return the completed payment to the webhook handler.

**Why the transaction matters**

1. The payment and booking represent one successful payment.
2. If only one status changed, the records would disagree. The transaction makes the two changes succeed together or fail together.

### 4. `closePendingPaymentIntoDB` — **CRITICAL: conditional update**

**Check the incoming event**

1. **Start:** The verified Stripe webhook passes payment details after Checkout fails or expires.
2. If the requested new status is not `FAILED` or `CANCELLED`, stop.
3. Find the payment. If its booking ID, provider, or Stripe session ID does not match the event, stop.
4. If its status is no longer `PENDING`, return its current record.

**Conditional database update**

1. Try to update the payment **only if it is still `PENDING`** and its session ID still matches.
2. If zero records were updated, another request may have changed it first; stop with a conflict error.
3. Find and return the updated payment to the webhook handler.
4. Leave the booking status unchanged.

### 5. `refundCancelledBookingPaymentIntoDB` — **CRITICAL: external refund request**

**Check whether a refund is needed**

1. **Start:** Payment details come from the Stripe webhook or from `refundCancelledPaidBookingIntoDB`.
2. If the currency is not BDT, stop.
3. Find the payment and its booking. If the IDs, provider, Stripe session ID, or amount do not match, stop.
4. If the booking is not `CANCELLED`, stop.
5. If the payment is already `REFUND_PENDING` or `REFUNDED`, return it without requesting another refund.

**External provider call**

1. Ask the provider factory for the payment's provider.
2. Call its `refundPayment` method. The Stripe provider finds the original payment and requests the refund.
3. The Stripe provider uses the payment ID as an idempotency key. If the request is repeated, that key helps prevent a second refund for the same payment.
4. Wait for the provider to return a refund ID and status.

**Save the result**

1. If Stripe reports success, choose `REFUNDED`; if it reports failure, choose `REFUND_FAILED`; otherwise, choose `REFUND_PENDING`.
2. Save the refund ID and status on the payment, provided another request has not already changed it.
3. Return the payment to the caller. A later Stripe refund event may update the saved status.

**Why this is separate from a database transaction**

1. Stripe processes the actual refund outside your database.
2. Your database then records Stripe's result. A database transaction cannot include Stripe's external API call.

### 6. `updateRefundStatusIntoDB`

1. **Start:** Stripe sends a refund event. The webhook handler verifies it, retrieves the latest refund details from Stripe, and passes the provider, refund ID, and status here.
2. If the status is `succeeded`, choose `REFUNDED`.
3. If the status is `failed` or `canceled`, choose `REFUND_FAILED`.
4. If it is another status, stop without changing the database.
5. Find the payment using the provider and refund ID, then update its status.
6. If no payment was updated, stop with “Payment for this refund was not found.”
7. Otherwise, return control to the webhook handler. This method does not return a payment object.

### 7. `getMyPaymentsFromDB`

1. **Start:** A customer calls `GET /api/payments`. Authentication supplies their user ID, and the payment controller passes that ID here.
2. Find payments whose bookings belong to that customer.
3. Include each payment's basic details, booking status, and service title.
4. Sort the payments from newest to oldest.
5. Return the list to the controller, which sends it to the customer.

### 8. `getPaymentByIdFromDB`

1. **Start:** A customer calls `GET /api/payments/:id`. The route validates the payment ID; authentication supplies the customer ID.
2. The payment controller passes both IDs here.
3. Find a payment with that ID **whose booking belongs to that customer**.
4. If no payment matches, stop with “Payment not found.” This also covers a payment owned by someone else.
5. If it matches, return its payment, booking, and service details to the controller.

### 9. `refundCancelledPaidBookingIntoDB` — **CRITICAL: after booking transaction**

**Where its input comes from**

1. **Start:** A customer requests cancellation of a paid booking.
2. The booking service changes the booking to `CANCELLED` inside its own transaction.
3. **After that transaction finishes**, the booking service passes the cancelled booking ID to this method.

**Find and refund the payment**

1. Find the newest payment for the booking with status `COMPLETED`, `REFUND_PENDING`, or `REFUNDED`.
2. If none exists, or it has no provider session ID, stop with an error.
3. Build the payment details needed for a refund.
4. Pass those details to `refundCancelledBookingPaymentIntoDB` and wait for it to finish.
5. Return its result to the booking service. The booking service then returns the cancelled booking to its controller.

**Why it runs after the booking transaction**

1. Save the cancellation and close the database transaction.
2. Then make the external Stripe refund request without keeping that transaction open.
