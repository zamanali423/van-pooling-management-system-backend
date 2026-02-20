const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  getPaymentHistory,
} = require("../../controllers/payments/paymentController");
const router = express.Router();

router.get("/payment-history", verifyToken, getPaymentHistory);

module.exports = router;
