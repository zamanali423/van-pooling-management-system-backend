/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         amount:
 *           type: number
 *           example: 2500
 *         payment_status:
 *           type: string
 *           example: Paid
 *         payment_date:
 *           type: string
 *           format: date-time
 *           example: 2025-01-15T12:00:00.000Z
 *         booking_id:
 *           type: integer
 *           example: 5
 *         child_name:
 *           type: string
 *           example: Ahmed
 *         van_number:
 *           type: string
 *           example: ABC-123
 *         driver_name:
 *           type: string
 *           example: Ali Khan
 *
 *     PaymentHistoryResponse:
 *       type: object
 *       properties:
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/parents/payment-history:
 *   get:
 *     summary: Get payment history for logged-in parent
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentHistoryResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
