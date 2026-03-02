const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/verifyToken");
const {
  driverApplications,
  verifyDriver,
  report,
} = require("../../controllers/police/policeController");

router.get("/driver-applications", verifyToken, driverApplications);
router.put("/verify-driver/:driver_id", verifyToken, verifyDriver);
router.get("/report", verifyToken, report);

module.exports = router;
