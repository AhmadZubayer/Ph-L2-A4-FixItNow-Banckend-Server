/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users
 *     description: Returns users ordered by creation date, newest first.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns each user's ID, name, email, role, active status, and timestamps
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Change a user's active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user whose status will change
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activeStatus]
 *             properties:
 *               activeStatus:
 *                 type: string
 *                 enum: [ACTIVE, BLOCKED]
 *     responses:
 *       200:
 *         description: Returns the user with their updated status
 *       400:
 *         description: Invalid user ID or active status
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: User not found
 *       409:
 *         description: Admin cannot block their own account
 */

/**
 * @openapi
 * /api/admin/bookings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all bookings
 *     description: Returns all bookings ordered by creation date, newest first.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns bookings with their customer, service, and technician details
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */