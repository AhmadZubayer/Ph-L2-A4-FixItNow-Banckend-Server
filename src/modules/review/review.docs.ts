/**
 * @openapi
 * /api/reviews:
 *   post:
 *     tags:
 *       - Review
 *     summary: Review a completed booking
 *     description: A customer can review one of their completed bookings once.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, rating]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid booking ID, rating, or comment
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Booking not found for this customer
 *       409:
 *         description: Booking is not completed or already has a review
 */