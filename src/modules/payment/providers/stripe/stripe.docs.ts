/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Receive payment and refund events from Stripe
 *     description: Stripe sends a signed event to this endpoint. It cannot be tested with an ordinary request from Swagger UI.
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: The raw JSON event body sent by Stripe
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Event received
 *       400:
 *         description: Missing or invalid Stripe signature or event body
 */

/**
 * @openapi
 * /api/payments/return/success:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Show the return message after Stripe Checkout
 *     description: The customer's browser visits this URL after completing Stripe Checkout. Payment confirmation is handled separately by the webhook.
 *     responses:
 *       200:
 *         description: Returns a plain text message while payment confirmation is pending
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

/**
 * @openapi
 * /api/payments/return/cancel:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Show the return message when the customer leaves Stripe Checkout
 *     description: The customer's browser visits this URL after leaving Checkout without completing payment.
 *     responses:
 *       200:
 *         description: Returns a plain text cancellation message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */