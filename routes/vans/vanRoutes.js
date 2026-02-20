const express = require("express");
const verifyToken = require("../../middlewares/verifyToken");
const {
  getVans,
  bookVan,
  getVanDetails,
} = require("../../controllers/vans/vanController");
const router = express.Router();

router.get("/", verifyToken, getVanDetails);
router.get("/all", verifyToken, getVans);
router.post("/book/:vanId", verifyToken, bookVan);

module.exports = router;
