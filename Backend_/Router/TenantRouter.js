const express = require("express");
const { registerTenant, verifyEmail, verifyLicenseKey } = require("../controllers/TenantController");
const upload = require("../config/upload");

const router = express.Router();

// Tenant Registration Routes
router.post("/register", upload.single("logoFile"), registerTenant);
router.get("/verify/:token", verifyEmail);
router.get("/verify-license/:licenseKey", verifyLicenseKey);

module.exports = router;
