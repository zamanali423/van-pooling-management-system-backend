/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Van Pooling & School Transport Management API - Guard Module
 *   version: 1.1.0
 *   description: API endpoints for guards in the van pooling management system
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     VerifyStudent:
 *       type: object
 *       properties:
 *         is_verified:
 *           type: boolean
 *           example: true
 *
 *     VerifyAllResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "All children verified successfully"
 *         verifiedCount:
 *           type: integer
 *           example: 25
 *
 *     Van:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         license_plate:
 *           type: string
 *           example: "ABC-1234"
 *         model:
 *           type: string
 *           example: "Mini Bus"
 *         status:
 *           type: string
 *           example: "active"
 *         fare:
 *           type: number
 *           example: 250
 *         total_children:
 *           type: integer
 *           example: 20
 *         driver_name:
 *           type: string
 *           example: "Ali Khan"
 *
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         full_name:
 *           type: string
 *         age:
 *           type: integer
 *         gender:
 *           type: string
 *           example: male
 *         school_id:
 *           type: integer
 *         van_id:
 *           type: integer
 *         is_verified:
 *           type: boolean
 *           example: false
 *         license_plate:
 *           type: string
 *         status:
 *           type: string
 *         parent_name:
 *           type: string
 *         parent_contact:
 *           type: string
 *
 * tags:
 *   - name: Guard
 *     description: Guard operations
 *
 * paths:
 *   /api/guards/active-vans:
 *     get:
 *       summary: Get all active vans for the guard's assigned school
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of active vans
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   vans:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Van'
 *         500:
 *           description: Server Error
 *
 *   /api/guards/students-to-verify:
 *     get:
 *       summary: Get list of students awaiting verification
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of students to verify
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   students:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Student'
 *         404:
 *           description: Guard not found or no children to verify
 *         500:
 *           description: Server Error
 *
 *   /api/guards/verify-student/{studentId}:
 *     put:
 *       summary: Verify a single student
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: studentId
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyStudent'
 *       responses:
 *         200:
 *           description: Student verified successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Child verified successfully"
 *                   child:
 *                     $ref: '#/components/schemas/Student'
 *         400:
 *           description: Invalid child, van, or guard not assigned
 *         500:
 *           description: Server Error
 *
 *   /api/guards/verify-all-students:
 *     put:
 *       summary: Verify all students under guard's school
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: All students verified successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/VerifyAllResponse'
 *         400:
 *           description: All children are already verified
 *         500:
 *           description: Server Error
 *
 *   /api/guards/all-students:
 *     get:
 *       summary: Get all students under guard's school
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of students with parent and van details
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   students:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Student'
 *         404:
 *           description: Guard not found
 *         500:
 *           description: Server Error
 *
 *   /api/guards/student-details/{studentId}:
 *     get:
 *       summary: Get full details of a specific student
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: studentId
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
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
 *         404:
 *           description: Student not found
 *         500:
 *           description: Server Error
 *
 *   /api/guards/get-van-details/{vanId}:
 *     get:
 *       summary: Get details of a specific van
 *       tags: [Guard]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: vanId
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Van details returned
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Van'
 *         404:
 *           description: Van not found
 *         500:
 *           description: Server Error
 */
