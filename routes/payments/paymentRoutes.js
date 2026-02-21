const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  getPaymentHistory,
  payNow,
} = require("../../controllers/payments/paymentController");
const router = express.Router();

router.get("/payment-history", verifyToken, getPaymentHistory);
// router.put("/pay-now/:booking_id", verifyToken, payNow);

module.exports = router;
