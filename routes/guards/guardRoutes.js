const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  getActiveVans,
  studentsToVerify,
  verifyToStudent,
  verifyToAllStudents,
  getAllStudents,
  getStudentDetails,
  recentVerifiedStudents,
} = require("../../controllers/guards/guardController");
const { getVanDetails } = require("../../controllers/vans/vanController");
const router = express.Router();

router.get("/active-vans", verifyToken, getActiveVans);
router.get("/students-to-verify", verifyToken, studentsToVerify);
router.put("/verify-student/:studentId", verifyToken, verifyToStudent);
router.put("/verify-all-students", verifyToken, verifyToAllStudents);
router.get("/all-students", verifyToken, getAllStudents);
router.get("/student-details/:studentId", verifyToken, getStudentDetails);
router.get("/get-van-details/:vanId", verifyToken, getVanDetails);
router.get("/recent-verified-students", verifyToken, recentVerifiedStudents);

module.exports = router;
