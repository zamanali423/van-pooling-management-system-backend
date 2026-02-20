const express = require("express");
const {
  getBookings,
  getBookingDetails,
  cancelBooking,
  reBooking,
} = require("../../controllers/bookings/bookingController");
const verifyToken = require("../../middlewares/verifyToken");
const router = express.Router();

router.get("/bookings", verifyToken, getBookings);
router.get("/bookings/:bookingId", verifyToken, getBookingDetails);
router.put("/bookings/:bookingId/cancel", verifyToken, cancelBooking);
router.post("/bookings/:bookingId/rebook", verifyToken, reBooking);

module.exports = router;
