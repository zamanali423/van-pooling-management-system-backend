/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Van Pooling & School Transport Management API - Driver Module
 *   version: 1.0.0
 *   description: API endpoints for drivers in the van pooling management system
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Route:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         van_id:
 *           type: integer
 *           example: 4
 *         school_id:
 *           type: integer
 *           example: 3
 *         name:
 *           type: string
 *           example: "Morning Route A"
 *         latitude:
 *           type: number
 *           example: 24.88993
 *         longitude:
 *           type: number
 *           example: 67.02839
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-22T10:30:00Z"
 *
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         full_name:
 *           type: string
 *           example: "Ahmed"
 *         parent_name:
 *           type: string
 *           example: "Ali Khan"
 *         booking_id:
 *           type: integer
 *           example: 5
 *
 *     Feedback:
 *       type: object
 *       properties:
 *         parent_id:
 *           type: integer
 *           example: 2
 *         rating:
 *           type: integer
 *           example: 5
 *         comments:
 *           type: string
 *           example: "Very professional and kind parent."
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-25T12:00:00.000Z"
 *
 *     FeedbackHistoryResponse:
 *       type: object
 *       properties:
 *         feedbacks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feedback'
 *
 *     Complaint:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         reporter_driver_id:
 *           type: integer
 *           example: 4
 *         target_parent_id:
 *           type: integer
 *           example: 12
 *         van_id:
 *           type: integer
 *           example: 5
 *         category:
 *           type: string
 *           example: "Behavior"
 *         priority:
 *           type: string
 *           example: "High"
 *         title:
 *           type: string
 *           example: "Parent Misbehavior"
 *         description:
 *           type: string
 *           example: "Parent was late repeatedly."
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     ComplaintHistoryResponse:
 *       type: object
 *       properties:
 *         complaints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Complaint'
 *
 *     Van:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         driver_id:
 *           type: integer
 *           example: 5
 *         capacity:
 *           type: integer
 *           example: 20
 *         gender:
 *           type: string
 *           example: "male"
 *         type:
 *           type: string
 *           example: "Mini Bus"
 *         fare:
 *           type: number
 *           example: 250
 *         status:
 *           type: string
 *           example: "active"
 *         shift:
 *           type: string
 *           example: "Morning"
 *         license_plate:
 *           type: string
 *           example: "ABC-1234"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-12-22T15:30:00.000Z"
 *
 * tags:
 *   - name: Driver
 *     description: Driver module endpoints
 *
 * paths:
 *   /api/drivers/create-new-route:
 *     post:
 *       summary: Create a new route
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - school_id
 *                 - van_id
 *                 - name
 *               properties:
 *                 school_id:
 *                   type: integer
 *                   example: 3
 *                 van_id:
 *                   type: integer
 *                   example: 4
 *                 name:
 *                   type: string
 *                   example: "Morning Route A"
 *       responses:
 *         201:
 *           description: Route created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   route:
 *                     $ref: '#/components/schemas/Route'
 *
 *   /api/drivers/driver-routes:
 *     get:
 *       summary: Get all routes assigned to the logged-in driver
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Returns the driver's assigned routes
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   routes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Route'
 *
 *   /api/drivers/update-route-location/{routeId}:
 *     put:
 *       summary: Update the driver’s current route location
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: routeId
 *           required: true
 *           schema:
 *             type: integer
 *           example: 1
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - latitude
 *                 - longitude
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: 24.88993
 *                 longitude:
 *                   type: number
 *                   example: 67.02839
 *       responses:
 *         200:
 *           description: Route location updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Route location updated"
 *                   route:
 *                     $ref: '#/components/schemas/Route'
 *
 *   /api/drivers/delete-route/{routeId}:
 *     delete:
 *       summary: Delete a specific route
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: routeId
 *           required: true
 *           schema:
 *             type: integer
 *           example: 1
 *       responses:
 *         200:
 *           description: Route deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Route deleted successfully"
 *
 *   /api/drivers/assigned-students/{routeId}:
 *     get:
 *       summary: View students assigned to a route
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: routeId
 *           required: true
 *           schema:
 *             type: integer
 *           example: 1
 *       responses:
 *         200:
 *           description: Returns assigned students list
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   students:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Student'
 *
 *   /api/drivers/student-details/{studentId}:
 *     get:
 *       summary: View details of a specific student
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: studentId
 *           required: true
 *           schema:
 *             type: integer
 *           example: 10
 *       responses:
 *         200:
 *           description: Student details returned
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   student:
 *                     $ref: '#/components/schemas/Student'
 *
 *   /api/drivers/earning-by-year:
 *     get:
 *       summary: Get last 12 months earning summary
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Returns earnings grouped by months
 *
 *   /api/drivers/payment-history:
 *     get:
 *       summary: Get payment history of driver
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Returns driver payment history
 *
 *   /api/drivers/leave-and-assign-new-driver:
 *     put:
 *       summary: Reassign all vans and routes from the current driver to a new driver
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - newDriverId
 *                 - reason
 *               properties:
 *                 newDriverId:
 *                   type: integer
 *                   example: 5
 *                 reason:
 *                   type: string
 *                   example: "I'm not available due to illness"
 *       responses:
 *         200:
 *           description: Driver reassignment completed successfully
 *         400:
 *           description: No vans found for this driver
 *         500:
 *           description: Server error
 *
 *   /api/drivers/restore-driver:
 *     put:
 *       summary: Restore the original driver after reassignment
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - oldDriverId
 *               properties:
 *                 oldDriverId:
 *                   type: integer
 *                   example: 3
 *       responses:
 *         200:
 *           description: Original driver restored successfully
 *         400:
 *           description: No reassignments found to restore
 *         500:
 *           description: Server error
 *
 *   /api/drivers/feedback:
 *     post:
 *       summary: Submit feedback for a parent
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       responses:
 *         201:
 *           description: Feedback submitted successfully
 *         500:
 *           description: Server Error
 *
 *   /api/drivers/feedback-history:
 *     get:
 *       summary: Get feedback history of drivers
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Feedback list
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/FeedbackHistoryResponse'
 *         500:
 *           description: Server Error
 *
 *   /api/drivers/complaints:
 *     post:
 *       summary: Driver creates a complaint against a parent
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - parent_id
 *                 - description
 *               properties:
 *                 parent_id:
 *                   type: integer
 *                   example: 12
 *                 description:
 *                   type: string
 *                   example: "Parent was late repeatedly"
 *       responses:
 *         201:
 *           description: Complaint created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Complaint filed"
 *
 *   /api/drivers/complaints-history:
 *     get:
 *       summary: Get complaint history of the logged-in driver
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Complaint history fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ComplaintHistoryResponse'
 *
 *   /api/drivers/add-vans:
 *     post:
 *       summary: Add a new van for the driver
 *       tags: [Driver]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - capacity
 *                 - gender
 *                 - type
 *                 - fare
 *                 - status
 *                 - shift
 *                 - license_plate
 *               properties:
 *                 capacity:
 *                   type: integer
 *                   example: 20
 *                 gender:
 *                   type: string
 *                   example: "male"
 *                 type:
 *                   type: string
 *                   example: "Mini Bus"
 *                 fare:
 *                   type: number
 *                   example: 250
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 shift:
 *                   type: string
 *                   example: "Morning"
 *                 license_plate:
 *                   type: string
 *                   example: "ABC-1234"
 *       responses:
 *         201:
 *           description: Van added successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Van added successfully"
 *                   van:
 *                     $ref: '#/components/schemas/Van'
 */
