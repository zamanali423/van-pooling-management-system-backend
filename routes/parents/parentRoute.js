const express = require("express");
const {
  addChildren,
  getChildren,
  getChildDetails,
  updateChild,
  deleteChild,
  getFeedback,
  getFeedbackHistory,
  doComplaints,
  getComplaintsHistory,
} = require("../../controllers/parents/parentController");
const verifyToken = require("../../middlewares/verifyToken");
const { validateRequest } = require("../../middlewares/errorsHandling");
const {
  childUpdate,
  childValidation,
} = require("../../validation/parents/childValidation");
const {
  feedbackValidation,
} = require("../../validation/parents/feedbackValidation");
const {
  getPaymentHistory,
} = require("../../controllers/payments/paymentController");
const {
  getVans,
  getVanDetails,
  bookVan,
} = require("../../controllers/vans/vanController");
const {
  getBookings,
  getBookingDetails,
  cancelBooking,
  reBooking,
} = require("../../controllers/bookings/bookingController");
const upload = require("../../middlewares/upload");
const router = express.Router();


router.post(
  "/add-children",
  verifyToken,
  upload.fields([{ name: "child_pic", maxCount: 1 }]),
  validateRequest(childValidation),
  addChildren
);
router.get("/children", verifyToken, getChildren);
router.get("/children/:childId", verifyToken, getChildDetails);
router.put(
  "/children/:childId",
  verifyToken,
  upload.fields([{ name: "child_pic", maxCount: 1 }]),
  validateRequest(childUpdate),
  updateChild
);
router.delete("/children/:childId", verifyToken, deleteChild);
router.post(
  "/feedback",
  verifyToken,
  validateRequest(feedbackValidation),
  getFeedback
);
router.get("/feedback-history", verifyToken, getFeedbackHistory);
router.get("/payment-history", verifyToken, getPaymentHistory);
router.get("/vans/all", verifyToken, getVans);
router.get("/vans/:vanId", verifyToken, getVanDetails);
router.post("/vans/book/:id", verifyToken, bookVan);
router.get("/bookings", verifyToken, getBookings);
router.get("/bookings/:bookingId", verifyToken, getBookingDetails);
router.put("/bookings/:bookingId/cancel", verifyToken, cancelBooking);
router.post("/bookings/:bookingId/rebook", verifyToken, reBooking);
router.post("/complaints", verifyToken, doComplaints);
router.get("/complaints-history", verifyToken, getComplaintsHistory);
module.exports = router;
