const express = require("express");
const {
  getUser,
  editUserDetails,
  deleteUser,
} = require("../../controllers/users/userController");
const verifyToken = require("../../middlewares/verifyToken");
const router = express.Router();

router.get("/profile/me", verifyToken, getUser);
router.put("/profile/me/edit", verifyToken, editUserDetails);
router.delete("/profile/me/delete", verifyToken, deleteUser);

module.exports = router;
