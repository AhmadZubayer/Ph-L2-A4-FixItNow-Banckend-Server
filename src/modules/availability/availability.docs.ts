/**
 * @openapi
 * /api/technician/availability:
 *   put:
 *     tags:
 *       - Availability
 *     summary: Add future availability slots
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slots]
 *             properties:
 *               slots:
 *                 type: array
 *                 description: Times must include a timezone offset and must not overlap
 *                 items:
 *                   type: object
 *                   required: [startAt, endAt]
 *                   properties:
 *                     startAt:
 *                       type: string
 *                       format: date-time
 *                       description: Must be in the future
 *                     endAt:
 *                       type: string
 *                       format: date-time
 *                       description: Must be after startAt
 *     responses:
 *       200:
 *         description: Returns all free future slots after saving
 *       400:
 *         description: Invalid slots or technician profile is missing
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a technician or account is blocked
 *       409:
 *         description: A new slot overlaps existing availability
 */