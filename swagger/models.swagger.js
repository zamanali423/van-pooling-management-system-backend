/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - contact
 *         - role
 *         - address
 *       properties:
 *         username:
 *           type: string
 *           example: zamanali
 *         email:
 *           type: string
 *           example: zamanali@gmail.com
 *         password:
 *           type: string
 *           example: Zaman@123
 *         contact:
 *           type: string
 *           example: "03001234567"
 *         role:
 *           type: string
 *           enum:
 *             - parent
 *             - driver
 *             - guard
 *           example: parent
 *         address:
 *           type: string
 *           example: "Karachi, Pakistan"
 *
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: zamanali@gmail.com
 *         password:
 *           type: string
 *           example: Zaman@123
 *
 *     Children:
 *       type: object
 *       required:
 *         - parent_id
 *         - school_id
 *         - name
 *         - age
 *         - gender
 *         - grade
 *         - pickup_address
 *         - emergency_contact
 *       properties:
 *         parent_id:
 *           type: integer
 *           example: 1
 *         school_id:
 *           type: integer
 *           example: 12
 *         name:
 *           type: string
 *           example: Ali
 *         age:
 *           type: integer
 *           example: 10
 *         gender:
 *           type: string
 *           enum:
 *             - male
 *             - female
 *           example: male
 *         grade:
 *           type: string
 *           example: "5th Grade"
 *         disease:
 *           type: string
 *           example: None
 *         pickup_address:
 *           type: string
 *           example: "123 Main St, Karachi"
 *         emergency_contact:
 *           type: string
 *           example: "03009876543"
 */
