/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: List active categories
 *     responses:
 *       200:
 *         description: Returns active categories sorted by name
 */

/**
 * @openapi
 * /api/admin/categories:
 *   post:
 *     tags:
 *       - Category
 *     summary: Create a category (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 example: home-repair
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid category data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       409:
 *         description: Category name or slug already exists
 */

/**
 * @openapi
 * /api/admin/categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: List all categories (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all categories, including inactive ones, sorted by name
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */