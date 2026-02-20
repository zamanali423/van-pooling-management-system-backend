/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin related endpoints
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     SchoolRequest:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - start_time
 *         - end_time
 *       properties:
 *         name:
 *           type: string
 *           example: "City Public School"
 *         address:
 *           type: string
 *           example: "Street 12, DHA Phase 6, Karachi"
 *         start_time:
 *           type: string
 *           example: "08:00"
 *         end_time:
 *           type: string
 *           example: "13:30"
 *
 *     School:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 3
 *         name:
 *           type: string
 *           example: "City Public School"
 *         address:
 *           type: string
 *           example: "Street 12, DHA Phase 6, Karachi"
 *         start_time:
 *           type: string
 *           example: "08:00"
 *         end_time:
 *           type: string
 *           example: "13:30"
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/admin/pending-verification-requests:
 *   get:
 *     summary: Get all pending driver verification requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of results per page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Pending verification drivers fetched successfully
 */

/**
 * @swagger
 * /api/admin/update-verification-request/{id}:
 *   put:
 *     summary: Update driver verification request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_verified
 *             properties:
 *               is_verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Driver verification status updated successfully
 */

/**
 * @swagger
 * /api/admin/all-complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaints fetched successfully
 */

/**
 * @swagger
 * /api/admin/complaint-details/{complaintId}:
 *   get:
 *     summary: Get details of a specific complaint
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: complaintId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Complaint details fetched successfully
 */

/**
 * @swagger
 * /api/admin/is-complaint-solved/{id}:
 *   put:
 *     summary: Update complaint solved status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_solved
 *             properties:
 *               is_solved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Complaint status updated successfully
 */

/**
 * @swagger
 * /api/admin/all-users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */

/**
 * @swagger
 * /api/admin/view-user-details/{userId}:
 *   get:
 *     summary: Get details of a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details fetched successfully
 */

/**
 * @swagger
 * /api/admin/block-user/{id}:
 *   put:
 *     summary: Block or unblock a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_blocked
 *             properties:
 *               is_blocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User blocked/unblocked successfully
 */

/**
 * @swagger
 * /api/admin/delete-user/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */

/**
 * @swagger
 * /api/admin/all-drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Drivers fetched successfully
 */

/**
 * @swagger
 * /api/admin/show-driver-details/{driverId}:
 *   get:
 *     summary: Get details of a specific driver
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: driverId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Driver details fetched successfully
 */

/**
 * @swagger
 * /api/admin/update-status-driver/{id}:
 *   put:
 *     summary: Update driver's verification status and availability
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_verified:
 *                 type: boolean
 *               availability_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver status updated successfully
 */

/**
 * @swagger
 * /api/admin/top-rated-drivers:
 *   get:
 *     summary: Get top-rated drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: minRating
 *         in: query
 *         schema:
 *           type: number
 *           default: 4
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top-rated drivers fetched successfully
 */

/**
 * @swagger
 * /api/admin/all-drivers-with-documents:
 *   get:
 *     summary: Get all drivers with their documents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Drivers with documents fetched successfully
 */

/**
 * @swagger
 * /api/admin/drivers-documents-details/{driverId}:
 *   get:
 *     summary: Get a driver's document details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: driverId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Driver document details fetched successfully
 */

/**
 * @swagger
 * /api/admin/verify-drivers-documents/{id}:
 *   put:
 *     summary: Verify or update a driver's documents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driver_license:
 *                 type: string
 *               id_card:
 *                 type: string
 *               vehicle_registration:
 *                 type: string
 *               vehicle_photo:
 *                 type: string
 *               number_plate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver documents verified successfully
 */

/**
 * @swagger
 * /api/admin/all-routes-with-drivers-and-stops:
 *   get:
 *     summary: Get all routes with drivers and stops
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routes fetched successfully
 */

/**
 * @swagger
 * /api/admin/route-details/{routeId}:
 *   get:
 *     summary: Get details of a specific route
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: routeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route details fetched successfully
 */

/**
 * @swagger
 * /api/admin/delete-route/{routeId}:
 *   delete:
 *     summary: Delete a specific route
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: routeId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route deleted successfully
 */

/**
 * @swagger
 * /api/admin/add-school:
 *   post:
 *     summary: Add a new school
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolRequest'
 *     responses:
 *       201:
 *         description: School added successfully
 */

/**
 * @swagger
 * /api/admin/get-school/{id}:
 *   get:
 *     summary: Get school details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: School fetched successfully
 */

/**
 * @swagger
 * /api/admin/update-school/{id}:
 *   put:
 *     summary: Update school details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolRequest'
 *     responses:
 *       200:
 *         description: School updated successfully
 */

/**
 * @swagger
 * /api/admin/delete-school/{id}:
 *   delete:
 *     summary: Delete a school
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: School deleted successfully
 */
