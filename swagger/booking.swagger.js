/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Parent booking management APIs
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 15
 *         status:
 *           type: string
 *           example: ACTIVE
 *         booked_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-20T10:30:00Z"
 *         van_id:
 *           type: integer
 *           example: 3
 *         number_plate:
 *           type: string
 *           example: "ABC-123"
 *         fare:
 *           type: number
 *           example: 150.5
 *         driver_name:
 *           type: string
 *           example: "Ali Khan"
 *         child_name:
 *           type: string
 *           example: "Ahmed"
 *
 *     CancelBookingResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Booking cancelled"
 *
 *     ReBookingResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Booking rebooked"
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 *
 * /api/parents/bookings:
 *   get:
 *     summary: Get all bookings of the parent
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *
 * /api/parents/bookings/{bookingId}:
 *   get:
 *     summary: Get details of a specific booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 * /api/parents/bookings/{bookingId}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CancelBookingResponse'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 * /api/parents/bookings/{bookingId}/rebook:
 *   post:
 *     summary: Rebook an existing booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       201:
 *         description: Booking rebooked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReBookingResponse'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
