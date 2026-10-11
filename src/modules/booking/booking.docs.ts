/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags:
 *       - Booking
 *     summary: Book a technician's available slot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, availabilitySlotId]
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               availabilitySlotId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Booking created with REQUESTED status
 *       400:
 *         description: Invalid IDs or slot is too short for the service
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Active service not found
 *       409:
 *         description: Slot is unavailable or already booked
 */

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     tags:
 *       - Booking
 *     summary: List my bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the customer's bookings, newest first
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 */

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags:
 *       - Booking
 *     summary: Get one of my bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the booking with service, category, and technician details
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Booking not found for this customer
 */

/**
 * @openapi
 * /api/technician/bookings:
 *   get:
 *     tags:
 *       - Booking
 *     summary: List bookings for my services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the technician's bookings with customer and service details, newest first
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a technician or account is blocked
 */

/**
 * @openapi
 * /api/technician/bookings/{id}:
 *   patch:
 *     tags:
 *       - Booking
 *     summary: Update a booking's status (technician only)
 *     description: 'Allowed transitions: REQUESTED to ACCEPTED or DECLINED; PAID to IN_PROGRESS; IN_PROGRESS to COMPLETED.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid booking ID or status value
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a technician or account is blocked
 *       404:
 *         description: Booking not found for this technician
 *       409:
 *         description: Status change is not allowed or booking changed during the update
 */

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags:
 *       - Booking
 *     summary: Cancel one of my bookings
 *     description: A customer can cancel a REQUESTED, ACCEPTED, or PAID booking. Cancelling a paid booking starts a refund.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the cancelled booking
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a customer or account is blocked
 *       404:
 *         description: Booking not found for this customer
 *       409:
 *         description: Booking cannot be cancelled or its status changed during the request
 */