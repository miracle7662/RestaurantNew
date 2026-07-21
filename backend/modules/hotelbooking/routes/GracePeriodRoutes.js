const express = require("express");
const router = express.Router();
const controller = require("../controllers/GracePeriodController");

router.get("/:hotelid", controller.getGracePeriodSettings);
router.post("/", controller.saveGracePeriodSettings);

module.exports = router;