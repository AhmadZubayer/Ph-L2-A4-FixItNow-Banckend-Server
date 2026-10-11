/**
 * @openapi
 * /api/services:
 *   get:
 *     tags:
 *       - Service
 *     summary: List available services
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
 *         name: minPrice
 *         description: Minimum price in BDT
 *         schema:
 *           type: string
 *           pattern: '^\d{1,8}(\.\d{1,2})?$'
 *       - in: query
 *         name: maxPrice
 *         description: Maximum price in BDT; must be at least minPrice
 *         schema:
 *           type: string
 *           pattern: '^\d{1,8}(\.\d{1,2})?$'
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Returns matching active services with category, technician, and rating details
 *       400:
 *         description: Invalid filter values
 */

/**
 * @openapi
 * /api/technician/services:
 *   post:
 *     tags:
 *       - Service
 *     summary: Create a service (technician only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, price, durationMinutes, categoryId]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *               description:
 *                 type: string
 *                 minLength: 1
 *               price:
 *                 type: string
 *                 description: Price in BDT; must be greater than zero
 *                 pattern: '^\d{1,8}(\.\d{1,2})?$'
 *                 example: "750.00"
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 1
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid data or technician profile is missing
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a technician or account is blocked
 *       404:
 *         description: Active category not found
 */