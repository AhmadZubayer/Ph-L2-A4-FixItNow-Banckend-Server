/**
 * @openapi
 * /api/payments/create:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a checkout session for an accepted booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, SSLCOMMERZ]
 *                 default: STRIPE
 *                 description: Only STRIPE is implemented; SSLCOMMERZ currently returns 501
 *     responses:
 *       201:
 *         description: Returns a paymentId and checkoutUrl for the customer
 *       400:
 *         description: Invalid payment request
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Booking not found for this customer
 *       409:
 *         description: Booking is not payable or a payment is already in progress
 *       501:
 *         description: Selected payment provider is not implemented
 */

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags:
 *       - Payment
 *     summary: List my payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the customer's payments with booking status and service title, newest first
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 */

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get one of my payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the payment with its amount, provider, status, and booking details
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Payment not found for this customer
 */