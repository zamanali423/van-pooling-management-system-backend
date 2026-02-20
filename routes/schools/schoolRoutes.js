const express = require("express");
const router = express.Router();
const {
  getAllSchools,
} = require("../../controllers/schools/schoolsController");
const verifyToken = require("../../middlewares/verifyToken");

router.get("/all-schools", verifyToken, getAllSchools);

module.exports = router;
