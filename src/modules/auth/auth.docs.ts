/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a customer or technician
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, TECHNICIAN]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Email already registered
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Returns an access token and a refresh token
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account blocked
 */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's id, name, email, and role
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account blocked
 */

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Get a new access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Returns a new access token
 *       400:
 *         description: Refresh token is missing
 *       401:
 *         description: Refresh token is invalid or expired
 *       403:
 *         description: Account blocked
 */

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Update the current user's name or email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             anyOf:
 *               - required: [name]
 *               - required: [email]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Provide a valid name or email
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account blocked
 *       409:
 *         description: Email already registered
 */