/**
 * @swagger
 * components:
 *   schemas:
 *     Van:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 3
 *         driver_id:
 *           type: integer
 *           example: 12
 *         number_plate:
 *           type: string
 *           example: "ABC-123"
 *         capacity:
 *           type: integer
 *           example: 15
 *         fare:
 *           type: number
 *           example: 2500
 *         is_girls_only:
 *           type: boolean
 *           example: false
 *         photo_url:
 *           type: string
 *           example: "https://example.com/van.jpg"
 *         driver_name:
 *           type: string
 *           example: "Ali Khan"
 *         is_active:
 *           type: boolean
 *           example: true
 *
 *     VanListResponse:
 *       type: object
 *       properties:
 *         vans:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Van'
 *
 *     BookVanRequest:
 *       type: object
 *       required:
 *         - childId
 *       properties:
 *         childId:
 *           type: integer
 *           example: 7
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 55
 *         van_id:
 *           type: integer
 *           example: 3
 *         child_id:
 *           type: integer
 *           example: 7
 *         status:
 *           type: string
 *           example: "ACTIVE"
 *         booking_date:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T12:00:00Z"
 *
 *     BookVanResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Booked successfully"
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 */

/**
 * @swagger
 * /api/parents/vans/all:
 *   get:
 *     summary: Get all active vans with driver info
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VanListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/parents/vans/{vanId}:
 *   get:
 *     summary: Get details of a specific van
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the van
 *     responses:
 *       200:
 *         description: Van details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 van:
 *                   $ref: '#/components/schemas/Van'
 *       404:
 *         description: Van not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/parents/vans/book/{vanId}:
 *   post:
 *     summary: Book a van for a child
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the van to book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookVanRequest'
 *     responses:
 *       201:
 *         description: Van booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookVanResponse'
 *       400:
 *         description: Booking failed (van full, child already booked, invalid)
 *       404:
 *         description: Van or child not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
