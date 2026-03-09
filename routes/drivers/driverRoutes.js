const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  createNewRoute,
  getDriverRoutes,
  updateRouteLocation,
  deleteRoute,
  viewAssignedStudents,
  viewStudentDetails,
  getEarningByYear,
  viewPaymentHistory,
  leaveAndAssignNewDriver,
  restoreDriver,
  getFeedback,
  getFeedbackHistory,
  doComplaints,
  getComplaintsHistory,
  allStudents,
  delayReports,
  latestEarnings,
  earningPerStudents,
} = require("../../controllers/drivers/driverController");
const { validateRequest } = require("../../middlewares/errorsHandling");
const {
  createNewRouteValidation,
  updateRouteValidation,
} = require("../../validation/driver/driverValidation");
const {
  feedbackValidation,
} = require("../../validation/parents/feedbackValidation");
const { addVansByDriver } = require("../../controllers/vans/vanController");
const router = express.Router();

router.post(
  "/create-new-route",
  verifyToken,
  validateRequest(createNewRouteValidation),
  createNewRoute,
);
router.get("/driver-routes", verifyToken, getDriverRoutes);
router.put(
  "/update-route-location/:routeId",
  verifyToken,
  validateRequest(updateRouteValidation),
  updateRouteLocation,
);
router.delete("/delete-route/:routeId", verifyToken, deleteRoute);
router.get("/assigned-students/:routeId", verifyToken, viewAssignedStudents);
router.get("/student-details/:studentId", verifyToken, viewStudentDetails);
router.get("/earning-by-year", verifyToken, getEarningByYear);
router.get("/payment-history", verifyToken, viewPaymentHistory);
router.put(
  "/leave-and-assign-new-driver",
  verifyToken,
  leaveAndAssignNewDriver,
);
router.put("/restore-driver", verifyToken, restoreDriver);
router.post("/feedback", verifyToken, getFeedback);
router.get("/feedback-history", verifyToken, getFeedbackHistory);
router.post("/complaints", verifyToken, doComplaints);
router.get("/complaints-history", verifyToken, getComplaintsHistory);
router.post("/add-vans", verifyToken, addVansByDriver);
router.get("/all-students", verifyToken, allStudents);
router.get("/delay-reports", verifyToken, delayReports);
router.get("/latest-earnings", verifyToken, latestEarnings);
router.get("/earning-per-students", verifyToken, earningPerStudents);

module.exports = router;
