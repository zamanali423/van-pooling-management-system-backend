/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Van Pooling & School Transport Management API - Parents Module
 *   version: 1.0.1
 *   description: API endpoints for parents in the van pooling management system
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Child:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         parent_id:
 *           type: integer
 *           example: 5
 *         school_id:
 *           type: integer
 *           example: 10
 *         full_name:
 *           type: string
 *           example: Ali Khan
 *         age:
 *           type: integer
 *           example: 7
 *         gender:
 *           type: string
 *           enum: [male, female]
 *           example: male
 *
 *     AddChildRequest:
 *       type: object
 *       required:
 *         - school_id
 *         - full_name
 *         - age
 *         - gender
 *       properties:
 *         school_id:
 *           type: integer
 *           example: 2
 *         full_name:
 *           type: string
 *           example: Ali Khan
 *         age:
 *           type: integer
 *           example: 8
 *         gender:
 *           type: string
 *           example: male
 *
 *     AddChildResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Child added
 *         childId:
 *           type: integer
 *           example: 15
 *
 *     ChildrenListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Child'
 *
 *     Feedback:
 *       type: object
 *       required:
 *         - driver_id
 *         - child_id
 *         - rating
 *       properties:
 *         driver_id:
 *           type: integer
 *           example: 3
 *         child_id:
 *           type: integer
 *           example: 1
 *         rating:
 *           type: integer
 *           example: 5
 *         comments:
 *           type: string
 *           example: Very professional and kind driver.
 *
 *     FeedbackHistoryResponse:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           driver:
 *             type: string
 *             example: Ali Driver
 *           rating:
 *             type: integer
 *             example: 5
 *           comments:
 *             type: string
 *             example: Very professional
 *           created_at:
 *             type: string
 *             format: date-time
 *
 *     ParentComplaintRequest:
 *       type: object
 *       required:
 *         - driver_id
 *         - school_id
 *         - description
 *       properties:
 *         driver_id:
 *           type: integer
 *           example: 7
 *         school_id:
 *           type: integer
 *           example: 3
 *         description:
 *           type: string
 *           example: Driver was driving very fast near school.
 *
 *     ParentComplaint:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 12
 *         parent_id:
 *           type: integer
 *           example: 5
 *         driver_id:
 *           type: integer
 *           example: 7
 *         school_id:
 *           type: integer
 *           example: 3
 *         description:
 *           type: string
 *           example: Driver was driving very fast.
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     ParentComplaintHistoryResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/ParentComplaint'
 *
 * tags:
 *   - name: Parents
 *     description: Parent management APIs
 *
 * paths:
 *   /api/parents/add-children:
 *     post:
 *       summary: Add a child to the parent's profile
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddChildRequest'
 *       responses:
 *         201:
 *           description: Child added successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AddChildResponse'
 *         400:
 *           description: School service inactive
 *         403:
 *           description: Parent not found
 *         500:
 *           description: Server Error
 *
 *   /api/parents/children:
 *     get:
 *       summary: Get all children of parent
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of children
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ChildrenListResponse'
 *         500:
 *           description: Server Error
 *
 *   /api/parents/children/{childId}:
 *     get:
 *       summary: Get details of a specific child
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: childId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Child details
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Child'
 *         404:
 *           description: Child not found
 *         500:
 *           description: Server Error
 *
 *     put:
 *       summary: Update child details
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: childId
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddChildRequest'
 *       responses:
 *         200:
 *           description: Child updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Updated
 *                   childId:
 *                     type: integer
 *                     example: 15
 *         404:
 *           description: Child not found
 *         500:
 *           description: Server Error
 *
 *     delete:
 *       summary: Delete a child
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: childId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Child deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Deleted
 *         404:
 *           description: Child not found
 *         500:
 *           description: Server Error
 *
 *   /api/parents/feedback:
 *     post:
 *       summary: Submit feedback for a driver
 *       tags: [Parents]
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
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Rating submitted
 *                   rating:
 *                     type: object
 *                     example:
 *                       driver_id: 3
 *                       parent_id: 5
 *                       child_id: 1
 *                       rating: 5
 *                       comments: Very professional
 *                       created_at: 2026-01-17T10:00:00Z
 *         404:
 *           description: Driver not found
 *         500:
 *           description: Server Error
 *
 *   /api/parents/feedback-history:
 *     get:
 *       summary: Get feedback history of parent
 *       tags: [Parents]
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
 *   /api/parents/complaints:
 *     post:
 *       summary: Submit a complaint against a driver
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParentComplaintRequest'
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
 *                     example: Complaint filed
 *                   complaint:
 *                     $ref: '#/components/schemas/ParentComplaint'
 *         500:
 *           description: Server Error
 *
 *   /api/parents/complaints-history:
 *     get:
 *       summary: Get complaint history of the parent
 *       tags: [Parents]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Complaint history
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ParentComplaintHistoryResponse'
 *         500:
 *           description: Server Error
 */
