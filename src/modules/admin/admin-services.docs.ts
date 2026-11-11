/**
 * @openapi
 * /api/admin/services:
 *   get:
 *     tags: [Admin]
 *     summary: List services available for moderation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service names, technicians, verification and active status
 *       403:
 *         description: Admin access required
 * /api/admin/services/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve, reject, pause, resume or withdraw a service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, pause, resume, delete]
 *     responses:
 *       200:
 *         description: Updated service; delete preserves historical booking references
 *       400:
 *         description: Invalid service ID or action
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Service not found or withdrawn
 *       409:
 *         description: Unapproved services cannot be resumed
 */
