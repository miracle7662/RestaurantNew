const express = require("express");
const router = express.Router();
const BillPreviewSettingsController = require("../controllers/billPreviewSettingsController");

router.post("/", BillPreviewSettingsController.createSetting);
router.get("/", BillPreviewSettingsController.getAllSettings);
router.get("/:id", BillPreviewSettingsController.getSettingById);
router.put("/:id", BillPreviewSettingsController.updateSetting);
router.delete("/:id", BillPreviewSettingsController.deleteSetting);

module.exports = router;
