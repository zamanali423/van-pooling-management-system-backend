/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         full_name:
 *           type: string
 *           example: Ali Khan
 *         email:
 *           type: string
 *           example: ali.khan@example.com
 *         phone:
 *           type: string
 *           example: +923001112223
 *         role:
 *           type: string
 *           example: PARENT
 *         profile_photo:
 *           type: string
 *           example: https://example.com/photo.jpg
 *         is_verified:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-01-15T12:00:00.000Z
 *
 *     EditUserRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           example: Ali Khan
 *         email:
 *           type: string
 *           example: ali.khan@example.com
 *         phone:
 *           type: string
 *           example: +923001112223
 *         password:
 *           type: string
 *           example: newpassword123
 *         profile_photo:
 *           type: string
 *           example: https://example.com/photo.jpg
 *
 *     EditUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Profile updated
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 *
 *     DeleteUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Account deleted successfully
 */

/**
 * @swagger
 * /api/users/profile/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/users/profile/me/edit:
 *   put:
 *     summary: Edit current authenticated user's details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EditUserResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/users/profile/me/delete:
 *   delete:
 *     summary: Delete current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteUserResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */
