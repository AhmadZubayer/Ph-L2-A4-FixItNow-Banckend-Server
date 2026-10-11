/**
 * @openapi
 * /api/technicians:
 *   get:
 *     tags:
 *       - Technician
 *     summary: List active technicians
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Returns matching technicians with active services and rating details
 *       400:
 *         description: Invalid filter values
 */

/**
 * @openapi
 * /api/technicians/{id}:
 *   get:
 *     tags:
 *       - Technician
 *     summary: Get a technician's public profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Technician profile ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the profile, active services, free future slots, reviews, and rating
 *       400:
 *         description: Invalid technician profile ID
 *       404:
 *         description: Technician not found
 */

/**
 * @openapi
 * /api/technician/profile:
 *   put:
 *     tags:
 *       - Technician
 *     summary: Create or update the current technician's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [skills, location]
 *             properties:
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   minLength: 1
 *               experienceYears:
 *                 type: integer
 *                 minimum: 0
 *               location:
 *                 type: string
 *                 minLength: 2
 *               profilePhoto:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Technician profile saved successfully
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a technician or account is blocked
 */