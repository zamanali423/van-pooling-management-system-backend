/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Zaman Ali
 *               email:
 *                 type: string
 *                 example: zamanali@example.com
 *               password:
 *                 type: string
 *                 example: myPassword123
 *               phone:
 *                 type: string
 *                 example: "03001234567"
 *               address:
 *                 type: string
 *                 example: "123 Street, City"
 *               school_id:
 *                 type: integer
 *                 example: 2
 *               role:
 *                 type: string
 *                 enum: [parent, driver, guard]
 *                 example: driver
 *               driver_photo:
 *                 type: string
 *                 format: binary
 *               driver_license:
 *                 type: string
 *                 format: binary
 *               id_card:
 *                 type: string
 *                 format: binary
 *               vehicle_registration:
 *                 type: string
 *                 format: binary
 *               vehicle_photo:
 *                 type: string
 *                 format: binary
 *               number_plate:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Successfully registered. Verify OTP.
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: zamanali@example.com
 *               phone:
 *                 type: string
 *                 example: "03001234567"
 *               password:
 *                 type: string
 *                 example: myPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: User not verified or awaiting approval
 */

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: zamanali@example.com
 *               phone:
 *                 type: string
 *                 example: "03001234567"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 */
