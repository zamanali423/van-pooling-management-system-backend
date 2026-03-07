const express = require("express");
const router = express.Router();
const {
  getAllSchools,
  allDrivers,
  allComplaints,
  verifyComplaint,
  driverMatrics,
} = require("../../controllers/schools/schoolsController");
const verifyToken = require("../../middlewares/verifyToken");

router.get("/all-schools", getAllSchools);
router.get("/all-drivers", verifyToken, allDrivers);
router.get("/all-complaints", verifyToken, allComplaints);
router.put("/verify-complaint/:complaintId", verifyToken, verifyComplaint);
router.get("/driver-metrics", verifyToken, driverMatrics);

module.exports = router;
