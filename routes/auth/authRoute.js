const express = require("express");
const {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require("../../controllers/auth/authController");
const { registerAuth, loginAuth } = require("../../validation/auth");
const { validateRequest } = require("../../middlewares/errorsHandling");
const upload = require("../../middlewares/upload");

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "driver_photo", maxCount: 1 },
    { name: "driver_license", maxCount: 1 },
    { name: "id_card", maxCount: 1 },
    { name: "vehicle_registration", maxCount: 1 },
    { name: "vehicle_photo", maxCount: 1 },
    { name: "number_plate", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
  ]),
  validateRequest(registerAuth),
  registerUser
);
router.post("/verify-otp", verifyOtp);
router.post("/login", validateRequest(loginAuth), loginUser);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
