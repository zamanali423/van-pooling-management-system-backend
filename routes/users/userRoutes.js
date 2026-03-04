const express = require("express");
const {
  getUser,
  editUserDetails,
  deleteUser,
} = require("../../controllers/users/userController");
const verifyToken = require("../../middlewares/verifyToken");
const upload = require("../../middlewares/upload");
const router = express.Router();

router.get("/profile/me", verifyToken, getUser);
router.put(
  "/profile/me/edit",
  verifyToken,
  upload.fields([{ name: "profile_photo", maxCount: 1 }]),
  editUserDetails,
);
router.delete("/profile/me/delete", verifyToken, deleteUser);

module.exports = router;
