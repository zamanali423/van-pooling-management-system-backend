const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  pendingVerificationDriversRequests,
  updateDriverVerification,
  allComplaints,
  complaintDetails,
  isComplaintSolved,
  allUsers,
  viewUserDetails,
  blockUser,
  deleteUser,
  allDrivers,
  showDriverDetails,
  updateStatusDriver,
  topRatedDrivers,
  allDriversWithDocuments,
  driversDocumentsDetails,
  verifyDriversDocuments,
  allRoutesWithDriversAndStops,
  routeDetails,
  deleteRoute,
  addSchools,
  getSchoolData,
  updateSchoolData,
  deleteSchool,
} = require("../../controllers/admin/adminController");
const { isAdmin } = require("../../middlewares/errorsHandling");
const router = express.Router();

router.get(
  "/pending-verification-requests",
  verifyToken,
  isAdmin,
  pendingVerificationDriversRequests
);
router.put(
  "/update-verification-request/:id",
  verifyToken,
  isAdmin,
  updateDriverVerification
);
router.get("/all-complaints", verifyToken, isAdmin, allComplaints);
router.get(
  "/complaint-details/:complaintId",
  verifyToken,
  isAdmin,
  complaintDetails
);
router.put("/is-complaint-solved/:id", verifyToken, isAdmin, isComplaintSolved);
router.get("/all-users", verifyToken, isAdmin, allUsers);
router.get("/view-user-details/:userId", verifyToken, isAdmin, viewUserDetails);
router.put("/block-user/:id", verifyToken, isAdmin, blockUser);
router.delete("/delete-user/:id", verifyToken, isAdmin, deleteUser);
router.get("/all-drivers", verifyToken, isAdmin, allDrivers);
router.get(
  "/show-driver-details/:driverId",
  verifyToken,
  isAdmin,
  showDriverDetails
);
router.put(
  "/update-status-driver/:id",
  verifyToken,
  isAdmin,
  updateStatusDriver
);
router.get("/top-rated-drivers", verifyToken, isAdmin, topRatedDrivers);
router.get(
  "/all-drivers-with-documents",
  verifyToken,
  isAdmin,
  allDriversWithDocuments
);
router.get(
  "/drivers-documents-details/:driverId",
  verifyToken,
  isAdmin,
  driversDocumentsDetails
);
router.put(
  "/verify-drivers-documents/:id",
  verifyToken,
  isAdmin,
  verifyDriversDocuments
);
router.get(
  "/all-routes-with-drivers-and-stops",
  verifyToken,
  isAdmin,
  allRoutesWithDriversAndStops
);
router.get("/route-details/:routeId", verifyToken, isAdmin, routeDetails);
router.delete("/delete-route/:routeId", verifyToken, isAdmin, deleteRoute);

router.post("/add-school", verifyToken, isAdmin, addSchools);
router.get("/get-school/:id", verifyToken, isAdmin, getSchoolData);
router.put("/update-school/:id", verifyToken, isAdmin, updateSchoolData);
router.delete("/delete-school/:id", verifyToken, isAdmin, deleteSchool);

module.exports = router;
